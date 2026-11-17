import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '../config/permissions';
import type { NotificationController } from '../controllers/NotificationController';
import { authorize } from '../middlewares/authorize';

/** Se monta en /api/notifications. Todo exige notification:read. */
export function createNotificationRoutes(controller: NotificationController, authenticate: RequestHandler): Router {
  const router = Router();
  const canRead = authorize(PERMISSIONS.NOTIFICATION_READ);

  router.get('/', authenticate, canRead, controller.list);
  router.get('/unread-count', authenticate, canRead, controller.unreadCount);
  router.patch('/read-all', authenticate, canRead, controller.markAllAsRead);
  router.patch('/:id/read', authenticate, canRead, controller.markAsRead);
  return router;
}
