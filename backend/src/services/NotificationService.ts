import { AppError } from '../errors/AppError';
import type { INotifier } from '../notifications/INotifier';
import type { NotifierChannel, NotifierFactory } from '../notifications/NotifierFactory';
import type { IObserver } from '../observer/IObserver';
import type { INotificationRepository } from '../repositories/interfaces/INotificationRepository';
import type { ISubscriberLookup } from '../repositories/interfaces/ISubscriptionRepository';
import type { LibroStatusChangedEvent } from '../types/events';
import type { InboxNotification, Notification } from '../types/notification';

/**
 * Patrón Observer — este es el OBSERVER.
 *
 * Se registra en el EventPublisher desde main.ts. Cuando un libro cambia de
 * estado, el publisher llama a update(evento) y este service:
 *   1. consulta las suscripciones (datos en la base) para saber a quién avisar,
 *   2. arma una Notification por cada suscriptor,
 *   3. la envía por cada canal. Los canales los creó la NotifierFactory (Factory);
 *      el de consola es el ConsoleNotifierAdapter (Adapter).
 *
 * Solo conoce INotifier: nunca hace `new` de un canal ni llama a console.log.
 * Además atiende la bandeja del usuario (listar, contar, marcar como leída).
 */
export class NotificationService implements IObserver<LibroStatusChangedEvent> {
  private readonly notifiers: INotifier[];

  constructor(
    private readonly subscribers: ISubscriberLookup,
    private readonly notifications: INotificationRepository,
    notifierFactory: NotifierFactory,
    channels: readonly NotifierChannel[],
  ) {
    // Los canales se piden a la Factory una sola vez. Agregar un canal nuevo
    // no requiere modificar esta clase (abierto/cerrado).
    this.notifiers = channels.map((channel) => notifierFactory.create(channel));
  }

  async update(event: LibroStatusChangedEvent): Promise<void> {
    const subscribers = await this.subscribers.findSubscribersByLibro(event.libroId);

    for (const subscriber of subscribers) {
      const notification: Notification = {
        recipientId: subscriber.userId,
        recipientEmail: subscriber.email,
        libroId: event.libroId,
        libroTitle: event.libroTitle,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        message: `El libro "${event.libroTitle}" cambió de estado: ${event.previousStatus} → ${event.newStatus}`,
        createdAt: event.changedAt,
      };

      for (const notifier of this.notifiers) {
        await notifier.send(notification);
      }
    }
  }

  // ---- Bandeja del usuario (RF5) ----

  listForUser(userId: number): Promise<InboxNotification[]> {
    return this.notifications.findByUser(userId);
  }

  countUnread(userId: number): Promise<number> {
    return this.notifications.countUnread(userId);
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const found = await this.notifications.markAsRead(notificationId, userId);
    if (!found) throw new AppError('NOT_FOUND', `No existe la notificación ${notificationId} en tu bandeja`);
  }

  markAllAsRead(userId: number): Promise<number> {
    return this.notifications.markAllAsRead(userId);
  }
}
