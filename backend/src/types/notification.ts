import type { LibroStatus } from './libro';

/**
 * La notificación que viaja por los canales (INotifier.send). Es la misma para
 * todos los canales: cada uno decide cómo entregarla.
 */
export interface Notification {
  recipientId: number;
  recipientEmail: string;
  libroId: number;
  libroTitle: string;
  previousStatus: LibroStatus;
  newStatus: LibroStatus;
  message: string;
  createdAt: Date;
}

/** Datos para guardar una notificación en la bandeja (canal in-app). */
export interface NewInboxNotification {
  userId: number;
  libroId: number;
  libroTitle: string;
  previousStatus: LibroStatus;
  newStatus: LibroStatus;
  message: string;
}

/** Una notificación de la bandeja del usuario, con su estado leída / no leída. */
export interface InboxNotification {
  id: number;
  /** null si el libro se eliminó después: la notificación se conserva igual. */
  libroId: number | null;
  libroTitle: string;
  previousStatus: LibroStatus;
  newStatus: LibroStatus;
  message: string;
  read: boolean;
  createdAt: Date;
}
