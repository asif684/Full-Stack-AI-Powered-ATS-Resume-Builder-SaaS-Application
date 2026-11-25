import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { AppError, handleAsync } from '../utils/errorHandler';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../validators/auth.schema';

export const register = handleAsync(async (req: Request, res: Response) => {
  const data = RegisterSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
  });

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: '', // Will be set after token generation
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, session.id);

  // Update session with token
  await prisma.session.update({
    where: { id: session.id },
    data: { token: accessToken },
  });

  res.status(201).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
});

export const login = async (req: Request, res: Response) => {
  try {
    console.log('=== LOGIN ATTEMPT STARTED ===');
    console.log('Request body:', req.body);

    const data = LoginSchema.parse(req.body);
    console.log('Data parsed:', data.email);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    console.log('User found:', user ? 'yes' : 'no');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    console.log('Password valid:', isValid);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('Session created:', session.id);

    const { accessToken, refreshToken } = generateTokens(user.id, session.id);
    console.log('Tokens generated');

    await prisma.session.update({
      where: { id: session.id },
      data: { token: accessToken },
    });
    console.log('Session updated');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===', error);
    throw error;
  }
}

export const logout = handleAsync(async (req: Request, res: Response) => {
  const authReq = req as any;
  if (authReq.session?.id) {
    await prisma.session.delete({ where: { id: authReq.session.id } });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export const refresh = handleAsync(async (req: Request, res: Response) => {
  const data = RefreshTokenSchema.parse(req.body);

  const decoded = verifyRefreshToken(data.refreshToken);
  if (!decoded) {
    throw new AppError('Invalid refresh token', 401);
  }

  const session = await prisma.session.findUnique({
    where: { id: decoded.sessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new AppError('Session expired', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.sessionId);

  await prisma.session.update({
    where: { id: decoded.sessionId },
    data: { token: accessToken },
  });

  res.json({
    success: true,
    accessToken,
    refreshToken: newRefreshToken,
  });
});

export const getMe = handleAsync(async (req: Request, res: Response) => {
  const authReq = req as any;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      profile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, user });
});