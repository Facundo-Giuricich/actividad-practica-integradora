import type { LibroStatus } from './libro';

/** Evento que publica LibroService cada vez que un libro cambia de estado. */
export interface LibroStatusChangedEvent {
  libroId: number;
  libroTitle: string;
  previousStatus: LibroStatus;
  newStatus: LibroStatus;
  changedAt: Date;
}
