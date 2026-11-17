import type { Subscription, UserSubscription } from '../../types/subscription';

/** Contrato de acceso a suscripciones (usuario ↔ libro). */
export interface ISubscriptionRepository {
  /** Crea la suscripción. Devuelve null si el usuario ya estaba suscripto. */
  create(userId: number, libroId: number): Promise<Subscription | null>;
  /** true si existía y se borró. */
  delete(userId: number, libroId: number): Promise<boolean>;
  findByUser(userId: number): Promise<UserSubscription[]>;
}
