import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate';
import type { AuthService } from '../services/AuthService';
import { asObject, readEmail, readString } from '../utils/validators';

/**
 * Controller: lee y valida la request, llama al service y arma la respuesta.
 * No tiene lógica de negocio. Los métodos son arrow functions para no perder
 * `this` al pasarlos como handlers a Express.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = asObject(req.body);
    const result = await this.authService.register({
      name: readString(body, 'name', { maxLength: 120 }),
      email: readEmail(body),
      password: readString(body, 'password', { minLength: 6, maxLength: 72, trim: false }),
    });
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = asObject(req.body);
    const result = await this.authService.login({
      email: readEmail(body),
      password: readString(body, 'password', { trim: false }),
    });
    res.json(result);
  };

  /** Datos y permisos del usuario logueado (el frontend lo usa al recargar la página). */
  me = (req: Request, res: Response): void => {
    res.json({ user: getAuthUser(req) });
  };
}
