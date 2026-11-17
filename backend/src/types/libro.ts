/** Estados posibles de un Libro (dominio C de la consigna). */
export const LIBRO_STATUSES = ['DISPONIBLE', 'PRESTADO', 'EN_REPARACION'] as const;
export type LibroStatus = (typeof LIBRO_STATUSES)[number];

/** Estado con el que se crea un libro si no se indica otro. */
export const DEFAULT_LIBRO_STATUS: LibroStatus = 'DISPONIBLE';

export function isLibroStatus(value: string): value is LibroStatus {
  return (LIBRO_STATUSES as readonly string[]).includes(value);
}

/** El recurso principal. */
export interface Libro {
  id: number;
  title: string;
  author: string;
  description: string;
  status: LibroStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewLibroData {
  title: string;
  author: string;
  description: string;
  status: LibroStatus;
}

/** Lo editable con libro:update. El estado NO: tiene su propio permiso (libro:change-status). */
export interface LibroUpdateData {
  title: string;
  author: string;
  description: string;
}

/** Resultado de un cambio de estado: hace falta el estado anterior para notificar "X → Y". */
export interface LibroStatusChange {
  libro: Libro;
  previousStatus: LibroStatus;
}
