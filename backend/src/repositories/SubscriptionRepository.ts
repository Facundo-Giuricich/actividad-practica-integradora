import { LibroModel, SubscriptionModel } from '../models';
import type { Subscription, UserSubscription } from '../types/subscription';
import type { ISubscriptionRepository } from './interfaces/ISubscriptionRepository';

export class SubscriptionRepository implements ISubscriptionRepository {
  async create(userId: number, libroId: number): Promise<Subscription | null> {
    // findOrCreate es atómico (usa una transacción): si dos requests llegan a la vez,
    // el índice único evita el duplicado y una de las dos recibe created = false.
    const [subscription, created] = await SubscriptionModel.findOrCreate({ where: { userId, libroId } });
    if (!created) return null;
    return {
      id: subscription.id,
      userId: subscription.userId,
      libroId: subscription.libroId,
      createdAt: subscription.createdAt,
    };
  }

  async delete(userId: number, libroId: number): Promise<boolean> {
    const deletedRows = await SubscriptionModel.destroy({ where: { userId, libroId } });
    return deletedRows > 0;
  }

  async findByUser(userId: number): Promise<UserSubscription[]> {
    const subscriptions = await SubscriptionModel.findAll({
      where: { userId },
      include: [{ model: LibroModel, as: 'libro', attributes: ['id', 'title', 'status'] }],
      order: [['createdAt', 'DESC']],
    });
    return subscriptions.map((subscription) => {
      const libro = subscription.libro;
      if (!libro) throw new Error(`La suscripción ${subscription.id} no tiene libro cargado`);
      return {
        libroId: subscription.libroId,
        createdAt: subscription.createdAt,
        libro: { id: libro.id, title: libro.title, status: libro.status },
      };
    });
  }
}
