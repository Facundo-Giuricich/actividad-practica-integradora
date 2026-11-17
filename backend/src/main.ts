import { config } from './config/env';
import { DatabaseConnection } from './database/DatabaseConnection';
import { createApp } from './app';

/**
 * Composition root: el ÚNICO lugar donde se crean los objetos y se conectan
 * entre sí. En las próximas etapas acá se van a instanciar repositorios,
 * services y controllers, pasándose las dependencias por constructor.
 */
async function main(): Promise<void> {
  const database = DatabaseConnection.getInstance();
  await database.connect();
  console.log(`[DB] Conectado a PostgreSQL en ${config.db.host}:${config.db.port}/${config.db.name}`);

  const app = createApp({
    checkDatabase: () => database.isHealthy(),
  });

  const server = app.listen(config.apiPort, () => {
    console.log(`[API] Escuchando en http://localhost:${config.apiPort}/api`);
  });

  // Apagado prolijo: docker compose stop manda SIGTERM.
  const shutdown = (signal: string): void => {
    console.log(`[API] ${signal} recibido, cerrando...`);
    server.close(() => {
      void database.close().then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  console.error('[FATAL] No se pudo iniciar la aplicación:', error);
  process.exit(1);
});
