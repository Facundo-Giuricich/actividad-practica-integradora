import { config } from './config/env';
import { DatabaseConnection } from './database/DatabaseConnection';
import { runSeed } from './database/seed';
import { initModels } from './models';
import { UserRepository } from './repositories/UserRepository';
import { RoleRepository } from './repositories/RoleRepository';
import { JwtTokenService } from './services/TokenService';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { createAuthenticate } from './middlewares/authenticate';
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createApp } from './app';

/**
 * Composition root: el ÚNICO lugar donde se crean los objetos y se conectan
 * entre sí. Ninguna otra clase hace `new` de sus dependencias: las recibe por
 * constructor. Se arma de abajo hacia arriba:
 * base de datos → repositorios → services → controllers → rutas → app.
 */
async function main(): Promise<void> {
  // 1. Base de datos (Singleton), modelos, tablas y datos iniciales.
  const database = DatabaseConnection.getInstance();
  await database.connect();
  console.log(`[DB] Conectado a PostgreSQL en ${config.db.host}:${config.db.port}/${config.db.name}`);
  initModels(database.getSequelize());
  await database.sync();
  await runSeed();

  // 2. Repositorios (implementaciones concretas de las interfaces).
  const userRepository = new UserRepository();
  const roleRepository = new RoleRepository();

  // 3. Services: reciben las dependencias tipadas como INTERFACES.
  const tokenService = new JwtTokenService(config.jwtSecret);
  const authService = new AuthService(userRepository, roleRepository, tokenService);
  const userService = new UserService(userRepository, roleRepository);

  // 4. Controllers y middlewares.
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const authenticate = createAuthenticate(tokenService, authService);

  // 5. Rutas y aplicación.
  const app = createApp({
    checkDatabase: () => database.isHealthy(),
    routes: [
      { path: '/api/auth', router: createAuthRoutes(authController, authenticate) },
      { path: '/api', router: createUserRoutes(userController, authenticate) },
    ],
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
