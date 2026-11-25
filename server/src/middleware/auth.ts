import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  session?: {
    id: string;
    token: string;
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string; sessionId: string };

    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
    };
    req.session = { id: session.id, token };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string; sessionId: string };
    req.user = { id: decoded.userId, email: '', name: undefined };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

export function generateTokens(userId: string, sessionId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId, sessionId } as object,
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as any }
  );

  const refreshToken = jwt.sign(
    { userId, sessionId, type: 'refresh' } as object,
    env.jwtSecret,
    { expiresIn: env.jwtRefreshExpiresIn as any }
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string; sessionId: string; type: string };
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId, sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}