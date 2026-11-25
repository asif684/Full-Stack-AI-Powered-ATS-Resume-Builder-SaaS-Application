import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../validators/auth.schema';
import { register, login, logout, refresh, getMe } from '../controllers/authController';
import { validateHandler } from '../middleware/validation';

const router = Router();

// Cast to any to avoid type issues with Route handler signatures
const r: any = router;

r.post('/register', validateHandler(RegisterSchema), register);
r.post('/login', validateHandler(LoginSchema), login);
r.post('/logout', authenticateToken, logout);
r.post('/refresh', validateHandler(RefreshTokenSchema), refresh);
r.get('/me', authenticateToken, getMe);

export default router;