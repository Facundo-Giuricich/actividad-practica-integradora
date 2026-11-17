import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '../config/permissions';
import type { SubscriptionController } from '../controllers/SubscriptionController';
import { authorize } from '../middlewares/authorize';

/** Se monta en /api. La suscripción es un sub-recurso del libro: /libros/:id/subscription. */
export function createSubscriptionRoutes(controller: SubscriptionController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post(
    '/libros/:id/subscription',
    authenticate,
    authorize(PERMISSIONS.SUBSCRIPTION_CREATE),
    controller.subscribe,
  );
  router.delete(
    '/libros/:id/subscription',
    authenticate,
    authorize(PERMISSIONS.SUBSCRIPTION_DELETE),
    controller.unsubscribe,
  );
  // Mis suscripciones (el frontend lo usa para mostrar "Suscribirse" o "Desuscribirse").
  // No hay permiso subscription:read en la tabla RF2: se exige libro:read, que tienen todos los roles.
  router.get('/subscriptions', authenticate, authorize(PERMISSIONS.LIBRO_READ), controller.listMine);
  return router;
}
