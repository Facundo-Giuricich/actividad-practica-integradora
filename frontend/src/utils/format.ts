import type { LibroStatus } from '../types';
import { ApiError } from '../api/client';

const STATUS_LABELS: Record<LibroStatus, string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  EN_REPARACION: 'En reparación',
};

export function statusLabel(status: LibroStatus): string {
  return STATUS_LABELS[status];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Mensaje legible para mostrar en pantalla a partir de cualquier error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}
