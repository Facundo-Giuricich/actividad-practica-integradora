import { config } from './config/env';
import { DatabaseConnection } from './database/DatabaseConnection';
import { runSeed } from './database/seed';
import { initModels } from './models';
import { UserRepository } from './repositories/UserRepository';
import { RoleRepository } from './repositories/RoleRepository';
import { LibroRepository } from './repositories/LibroRepository';
import { SubscriptionRepository } from './repositories/SubscriptionRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { EventPublisher } from './observer/EventPublisher';
import { NotifierFactory, type NotifierChannel } from './notifications/NotifierFactory';
import { JwtTokenService } from './services/TokenService';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { LibroService } from './services/LibroService';
import { SubscriptionService } from './services/SubscriptionService';
import { NotificationService } from './services/NotificationService';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { LibroController } from './controllers/LibroController';
import { SubscriptionController } from './controllers/SubscriptionController';
import { NotificationController } from './controllers/NotificationController';
import { createAuthenticate } from './middlewares/authenticate';
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createLibroRoutes } from './routes/libro.routes';
import { createSubscriptionRoutes } from './routes/subscription.routes';
import { createNotificationRoutes } from './routes/notification.routes';
import { createApp } from './app';
import type { LibroStatusChangedEvent } from './types/events';

/** Canales por los que se envía cada notificación (RF5: in-app y consola). */
const NOTIFICATION_CHANNELS: readonly NotifierChannel[] = ['inapp', 'console'];

/**
 * Composition root: el ÚNICO lugar donde se crean los objetos y se conectan
 * entre sí. Ninguna otra clase hace `new` de sus dependencias: las recibe por
 * constructor. Se arma de abajo hacia arriba:
 * base de datos → repositorios → patrones → services → controllers → rutas → app.
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
  const libroRepository = new LibroRepository();
  const subscriptionRepository = new SubscriptionRepository();
  const notificationRepository = new NotificationRepository();

  // 3. Notificaciones: Factory (crea los canales) + Observer (escucha los cambios de estado).
  const notifierFactory = new NotifierFactory(notificationRepository);
  const notificationService = new NotificationService(
    subscriptionRepository,
    notificationRepository,
    notifierFactory,
    NOTIFICATION_CHANNELS,
  );
  const libroEvents = new EventPublisher<LibroStatusChangedEvent>();
  libroEvents.attach(notificationService); // el observer se registra en el subject

  // 4. Services: reciben las dependencias tipadas como INTERFACES.
  const tokenService = new JwtTokenService(config.jwtSecret);
  const authService = new AuthService(userRepository, roleRepository, tokenService);
  const userService = new UserService(userRepository, roleRepository);
  const libroService = new LibroService(libroRepository, libroEvents);
  const subscriptionService = new SubscriptionService(subscriptionRepository, libroRepository);

  // 5. Controllers y middlewares.
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const libroController = new LibroController(libroService);
  const subscriptionController = new SubscriptionController(subscriptionService);
  const notificationController = new NotificationController(notificationService);
  const authenticate = createAuthenticate(tokenService, authService);

  // 6. Rutas y aplicación.
  const app = createApp({
    checkDatabase: () => database.isHealthy(),
    routes: [
      { path: '/api/auth', router: createAuthRoutes(authController, authenticate) },
      { path: '/api', router: createUserRoutes(userController, authenticate) },
      { path: '/api', router: createSubscriptionRoutes(subscriptionController, authenticate) },
      { path: '/api/libros', router: createLibroRoutes(libroController, authenticate) },
      { path: '/api/notifications', router: createNotificationRoutes(notificationController, authenticate) },
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
