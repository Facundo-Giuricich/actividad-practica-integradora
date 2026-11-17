import { NotificationModel } from '../models';
import type { InboxNotification, NewInboxNotification } from '../types/notification';
import type { INotificationRepository } from './interfaces/INotificationRepository';

export class NotificationRepository implements INotificationRepository {
  async create(data: NewInboxNotification): Promise<void> {
    await NotificationModel.create(data);
  }

  async findByUser(userId: number): Promise<InboxNotification[]> {
    const notifications = await NotificationModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });
    return notifications.map((n) => ({
      id: n.id,
      libroId: n.libroId,
      libroTitle: n.libroTitle,
      previousStatus: n.previousStatus,
      newStatus: n.newStatus,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  countUnread(userId: number): Promise<number> {
    return NotificationModel.count({ where: { userId, read: false } });
  }

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    // El userId en el WHERE impide marcar notificaciones de otro usuario.
    const notification = await NotificationModel.findOne({ where: { id: notificationId, userId } });
    if (!notification) return false;
    if (!notification.read) await notification.update({ read: true });
    return true;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const [affectedRows] = await NotificationModel.update({ read: true }, { where: { userId, read: false } });
    return affectedRows;
  }
}
