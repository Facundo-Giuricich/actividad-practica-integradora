import { Router, type RequestHandler } from 'express';
import { PERMISSIONS } from '../config/permissions';
import type { LibroController } from '../controllers/LibroController';
import { authorize } from '../middlewares/authorize';

/**
 * Se monta en /api/libros. Cada ruta: authenticate (¿quién sos?) →
 * authorize(permiso) (¿podés?) → controller.
 */
export function createLibroRoutes(controller: LibroController, authenticate: RequestHandler): Router {
  const router = Router();
  const P = PERMISSIONS;

  router.get('/', authenticate, authorize(P.LIBRO_READ), controller.list);
  router.get('/:id', authenticate, authorize(P.LIBRO_READ), controller.getById);
  router.post('/', authenticate, authorize(P.LIBRO_CREATE), controller.create);
  router.put('/:id', authenticate, authorize(P.LIBRO_UPDATE), controller.update);
  router.patch('/:id/status', authenticate, authorize(P.LIBRO_CHANGE_STATUS), controller.changeStatus);
  router.delete('/:id', authenticate, authorize(P.LIBRO_DELETE), controller.delete);
  return router;
}
