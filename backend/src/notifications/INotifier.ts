import type { Notification } from '../types/notification';

/**
 * Contrato que cumple TODO canal de notificación.
 *
 * NotificationService solo conoce esta interfaz: no sabe si la notificación
 * termina en la base, en la consola o (mañana) en un email. Cualquier INotifier
 * puede reemplazar a otro sin que el service cambie (sustitución de Liskov).
 */
export interface INotifier {
  send(notification: Notification): Promise<void>;
}
