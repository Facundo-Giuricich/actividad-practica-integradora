import type { Subscriber, Subscription, UserSubscription } from '../../types/subscription';

/**
 * Lo único que necesita NotificationService de las suscripciones: saber quién
 * sigue a un libro. Está separada (segregación de interfaces) para que el
 * observer no dependa de métodos que no usa, como create o delete.
 */
export interface ISubscriberLookup {
  findSubscribersByLibro(libroId: number): Promise<Subscriber[]>;
}

/** Contrato completo de acceso a suscripciones (usuario ↔ libro). */
export interface ISubscriptionRepository extends ISubscriberLookup {
  /** Crea la suscripción. Devuelve null si el usuario ya estaba suscripto. */
  create(userId: number, libroId: number): Promise<Subscription | null>;
  /** true si existía y se borró. */
  delete(userId: number, libroId: number): Promise<boolean>;
  findByUser(userId: number): Promise<UserSubscription[]>;
}
