import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '../config/permissions';
import type { UserController } from '../controllers/UserController';
import { authorize } from '../middlewares/authorize';

/**
 * Se monta en /api. Cada ruta declara qué permiso exige:
 * authenticate (¿quién sos?) → authorize (¿podés?) → controller.
 */
export function createUserRoutes(controller: UserController, authenticate: RequestHandler): Router {
  const router = Router();
  router.get('/users', authenticate, authorize(PERMISSIONS.USER_READ), controller.list);
  router.patch('/users/:id/role', authenticate, authorize(PERMISSIONS.USER_ASSIGN_ROLE), controller.assignRole);
  // Lista de roles para el selector del panel de administración.
  router.get('/roles', authenticate, authorize(PERMISSIONS.USER_ASSIGN_ROLE), controller.listRoles);
  return router;
}
