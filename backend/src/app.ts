import express, { type Express } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

/**
 * Lo que app.ts necesita recibir desde afuera. No importa la base de datos:
 * main.ts (composition root) le pasa una función para consultar su estado.
 */
export interface AppDependencies {
  checkDatabase: () => Promise<boolean>;
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
