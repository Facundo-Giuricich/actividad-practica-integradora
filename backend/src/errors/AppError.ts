/**
 * Errores "esperados" de la aplicación (datos inválidos, sin permiso, no existe...).
 *
 * Los services los lanzan con un código de NEGOCIO, no con un status HTTP:
 * los services no conocen Express ni HTTP. Es el errorHandler (capa web) el que
 * traduce cada código a su status (VALIDATION → 400, FORBIDDEN → 403, etc.).
 */
export type AppErrorCode = 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT';

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
