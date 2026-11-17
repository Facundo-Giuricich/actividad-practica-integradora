import type { Request, Response } from 'express';
import { ROLES, isRoleName } from '../config/permissions';
import { AppError } from '../errors/AppError';
import { getAuthUser } from '../middlewares/authenticate';
import type { UserService } from '../services/UserService';
import { asObject, parseId, readString } from '../utils/validators';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.userService.listUsers());
  };

  listRoles = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.userService.listRoles());
  };

  assignRole = async (req: Request, res: Response): Promise<void> => {
    const actor = getAuthUser(req);
    const userId = parseId(req.params.id);
    const role = readString(asObject(req.body), 'role');
    if (!isRoleName(role)) {
      throw new AppError('VALIDATION', `Rol inválido. Valores posibles: ${ROLES.join(', ')}`);
    }
    res.json(await this.userService.assignRole(actor.id, userId, role));
  };
}
