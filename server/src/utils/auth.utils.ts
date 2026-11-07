import type { Response, CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Signs a JWT with user payload
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verifies a JWT token signature and expiry
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Sets the authentication JWT inside a secure HTTP-only cookie
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.TOKEN_NAME, token, COOKIE_OPTIONS);
}

/**
 * Clears the authentication HTTP-only cookie
 */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.TOKEN_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
