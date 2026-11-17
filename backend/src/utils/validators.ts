import { AppError } from '../errors/AppError';

/*
 * Validación de entrada para los controllers. req.body llega sin tipo confiable
 * (cualquiera puede mandar cualquier JSON), así que se trata como `unknown` y se
 * revisa campo por campo antes de pasarlo a los services.
 */

export type JsonObject = Record<string, unknown>;

export function asObject(value: unknown): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError('VALIDATION', 'El cuerpo de la petición debe ser un objeto JSON');
  }
  // Seguro: ya se verificó que es un objeto no nulo y no es un array.
  return value as JsonObject;
}

interface StringRules {
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
}

export function readString(body: JsonObject, field: string, rules: StringRules = {}): string {
  const { minLength = 1, maxLength = 255, trim = true } = rules;
  const raw = body[field];
  if (typeof raw !== 'string') {
    throw new AppError('VALIDATION', `El campo "${field}" es obligatorio y debe ser texto`);
  }
  const value = trim ? raw.trim() : raw;
  if (value.length === 0) {
    throw new AppError('VALIDATION', `El campo "${field}" no puede estar vacío`);
  }
  if (value.length < minLength) {
    throw new AppError('VALIDATION', `El campo "${field}" debe tener al menos ${minLength} caracteres`);
  }
  if (value.length > maxLength) {
    throw new AppError('VALIDATION', `El campo "${field}" admite como máximo ${maxLength} caracteres`);
  }
  return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve el email normalizado en minúsculas, para que Ana@tp.com y ana@tp.com sean el mismo. */
export function readEmail(body: JsonObject, field = 'email'): string {
  const value = readString(body, field).toLowerCase();
  if (!EMAIL_PATTERN.test(value)) {
    throw new AppError('VALIDATION', `El campo "${field}" no es un email válido`);
  }
  return value;
}

/** Convierte un parámetro de ruta (/users/:id) en un entero positivo. */
export function parseId(value: string | string[] | undefined, name = 'id'): number {
  // En Express 5 un parámetro puede ser un array (rutas con comodín); acá solo vale texto.
  const id = typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('VALIDATION', `El parámetro "${name}" debe ser un entero positivo`);
  }
  return id;
}
