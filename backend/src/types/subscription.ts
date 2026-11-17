import type { LibroStatus } from './libro';

/** Dato persistido: "el usuario X sigue al libro Y". */
export interface Subscription {
  id: number;
  userId: number;
  libroId: number;
  createdAt: Date;
}

/** Una suscripción del usuario logueado, con los datos básicos del libro. */
export interface UserSubscription {
  libroId: number;
  createdAt: Date;
  libro: {
    id: number;
    title: string;
    status: LibroStatus;
  };
}
