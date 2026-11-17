import type { NextFunction, Request, Response } from 'express';
import { AppError, type AppErrorCode } from '../errors/AppError';

/** Traducción de códigos de negocio a status HTTP. Solo la capa web sabe de HTTP. */
const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

/** Rutas inexistentes: responde 404 en JSON en lugar del HTML por defecto de Express. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * Manejador de errores centralizado. Express 5 reenvía acá también los errores
 * de handlers async, así que los controllers no necesitan try/catch.
 * Recibe `unknown` porque en JavaScript se puede lanzar cualquier valor.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(STATUS_BY_CODE[err.code]).json({ error: err.message });
    return;
  }

  // JSON mal formado en el body (lo lanza express.json()).
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }

  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
