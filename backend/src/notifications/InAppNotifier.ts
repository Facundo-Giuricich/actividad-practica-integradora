import type { INotificationWriter } from '../repositories/interfaces/INotificationRepository';
import type { Notification } from '../types/notification';
import type { INotifier } from './INotifier';

/** Canal in-app: guarda la notificación en la base, como "no leída". */
export class InAppNotifier implements INotifier {
  constructor(private readonly notifications: INotificationWriter) {}

  async send(notification: Notification): Promise<void> {
    await this.notifications.create({
      userId: notification.recipientId,
      libroId: notification.libroId,
      libroTitle: notification.libroTitle,
      previousStatus: notification.previousStatus,
      newStatus: notification.newStatus,
      message: notification.message,
    });
  }
}
