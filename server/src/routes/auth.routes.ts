import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Registration: Rate limited + Zod schema validation
router.post('/register', authLimiter, validate({ body: registerSchema }), register);

// Login: Rate limited + Zod schema validation
router.post('/login', authLimiter, validate({ body: loginSchema }), login);

// Logout: Clears cookie
router.post('/logout', logout);

// Current user profile: Requires valid authentication
router.get('/me', authenticate, getMe);

export const authRoutes = router;
