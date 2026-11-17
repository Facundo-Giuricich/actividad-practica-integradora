import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate';
import type { SubscriptionService } from '../services/SubscriptionService';
import { parseId } from '../utils/validators';

/** El usuario siempre sale del token (req.user), nunca del body: uno solo se suscribe a sí mismo. */
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  subscribe = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const subscription = await this.subscriptionService.subscribe(user.id, parseId(req.params.id));
    res.status(201).json(subscription);
  };

  unsubscribe = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    await this.subscriptionService.unsubscribe(user.id, parseId(req.params.id));
    res.status(204).end();
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    res.json(await this.subscriptionService.listForUser(user.id));
  };
}
