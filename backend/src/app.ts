import express, { type Express, type Router } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

/** Un router ya armado y el prefijo donde se monta (ej. /api/auth). */
export interface RouteMount {
  path: string;
  router: Router;
}

/**
 * Lo que app.ts necesita recibir desde afuera. No crea controllers ni toca la
 * base: main.ts (composition root) le pasa todo ya construido.
 */
export interface AppDependencies {
  checkDatabase: () => Promise<boolean>;
  routes: RouteMount[];
}

/** Arma la aplicación Express (middlewares y rutas). No abre puertos: eso lo hace main.ts. */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    const database = await deps.checkDatabase();
    res.status(database ? 200 : 503).json({
      status: database ? 'ok' : 'degraded',
      database: database ? 'up' : 'down',
    });
  });

  for (const { path, router } of deps.routes) {
    app.use(path, router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
