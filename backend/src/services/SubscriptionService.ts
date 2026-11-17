import { AppError } from '../errors/AppError';
import type { ILibroRepository } from '../repositories/interfaces/ILibroRepository';
import type { ISubscriptionRepository } from '../repositories/interfaces/ISubscriptionRepository';
import type { Subscription, UserSubscription } from '../types/subscription';

/** Suscribirse y desuscribirse de un libro (RF4). */
export class SubscriptionService {
  constructor(
    private readonly subscriptions: ISubscriptionRepository,
    private readonly libros: ILibroRepository,
  ) {}

  async subscribe(userId: number, libroId: number): Promise<Subscription> {
    const libro = await this.libros.findById(libroId);
    if (!libro) throw new AppError('NOT_FOUND', `No existe el libro ${libroId}`);

    const subscription = await this.subscriptions.create(userId, libroId);
    if (!subscription) throw new AppError('CONFLICT', 'Ya estás suscripto a este libro');
    return subscription;
  }

  async unsubscribe(userId: number, libroId: number): Promise<void> {
    const deleted = await this.subscriptions.delete(userId, libroId);
    if (!deleted) throw new AppError('NOT_FOUND', 'No estás suscripto a este libro');
  }

  listForUser(userId: number): Promise<UserSubscription[]> {
    return this.subscriptions.findByUser(userId);
  }
}
