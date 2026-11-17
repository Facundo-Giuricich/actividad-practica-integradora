import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import type { AuthService } from '../services/AuthService';
import type { ITokenService } from '../services/TokenService';
import type { AuthUser } from '../types/user';

/**
 * ¿QUIÉN sos? Verifica el JWT del header "Authorization: Bearer <token>" y deja
 * en req.user el usuario con sus permisos ACTUALES (leídos de la base).
 * Sin token o con token inválido → 401.
 *
 * Es una "fábrica de middleware": recibe sus dependencias por parámetro
 * (desde main.ts) en lugar de crearlas adentro.
 */
export function createAuthenticate(tokens: ITokenService, auth: AuthService): RequestHandler {
  return async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Falta el token de sesión (header Authorization: Bearer <token>)');
    }
    const userId = tokens.verify(header.slice('Bearer '.length).trim());
    req.user = await auth.getAuthUser(userId);
    next();
  };
}

/** Para los controllers: obtiene el usuario logueado (authenticate ya corrió antes). */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw new AppError('UNAUTHORIZED', 'No hay una sesión iniciada');
  return req.user;
}
