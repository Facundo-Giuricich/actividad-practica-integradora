import type { NextFunction, Request, Response } from 'express';

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
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
