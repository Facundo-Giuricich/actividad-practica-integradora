import type { InboxNotification, NewInboxNotification } from '../../types/notification';

/**
 * Lo único que necesita el canal InAppNotifier: guardar. Separada del resto
 * (segregación de interfaces) para que el canal no pueda leer ni marcar bandejas.
 */
export interface INotificationWriter {
  create(data: NewInboxNotification): Promise<void>;
}

/** Contrato completo: además de guardar, la bandeja del usuario. */
export interface INotificationRepository extends INotificationWriter {
  findByUser(userId: number): Promise<InboxNotification[]>;
  countUnread(userId: number): Promise<number>;
  /** Solo marca si la notificación es de ese usuario. true si la encontró. */
  markAsRead(notificationId: number, userId: number): Promise<boolean>;
  /** Devuelve cuántas se marcaron. */
  markAllAsRead(userId: number): Promise<number>;
}
