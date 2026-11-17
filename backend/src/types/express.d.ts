import type { AuthUser } from './user';

/*
 * Amplía el tipo Request de Express para que TypeScript sepa que, después del
 * middleware authenticate, la request lleva el usuario logueado en req.user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
