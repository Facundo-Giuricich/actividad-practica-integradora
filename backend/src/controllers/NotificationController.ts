import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate';
import type { NotificationService } from '../services/NotificationService';
import { parseId } from '../utils/validators';

/** Bandeja del usuario logueado. Siempre trabaja sobre req.user: nadie ve la bandeja de otro. */
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.notificationService.listForUser(getAuthUser(req).id));
  };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    res.json({ count: await this.notificationService.countUnread(getAuthUser(req).id) });
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    await this.notificationService.markAsRead(parseId(req.params.id), getAuthUser(req).id);
    res.status(204).end();
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    res.json({ updated: await this.notificationService.markAllAsRead(getAuthUser(req).id) });
  };
}
