import type { RequestHandler } from 'express';
import type { PermissionName } from '../config/permissions';
import { AppError } from '../errors/AppError';

/**
 * ¿QUÉ podés hacer? Se usa siempre DESPUÉS de authenticate.
 * Si el rol del usuario no tiene el permiso pedido → 403, sin importar desde
 * dónde venga la request (frontend, Postman o curl).
 *
 * Uso en una ruta: router.get('/users', authenticate, authorize(PERMISSIONS.USER_READ), ...)
 */
export function authorize(permission: PermissionName): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'No hay una sesión iniciada');
    }
    if (!req.user.permissions.includes(permission)) {
      throw new AppError('FORBIDDEN', `Tu rol (${req.user.role}) no tiene el permiso "${permission}"`);
    }
    next();
  };
}
