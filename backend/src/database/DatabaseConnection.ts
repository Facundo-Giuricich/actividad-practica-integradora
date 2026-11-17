import { Sequelize } from 'sequelize';
import { config } from '../config/env';

/**
 * Patrón Singleton.
 *
 * Encapsula la única instancia de Sequelize (y por lo tanto el único pool de
 * conexiones a PostgreSQL) que usa toda la aplicación.
 *
 * - El constructor es privado: nadie puede hacer `new DatabaseConnection()`.
 * - La única forma de obtener el objeto es `DatabaseConnection.getInstance()`,
 *   que lo crea la primera vez y después devuelve siempre el mismo.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;

  private readonly sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: false,
      // Columnas en snake_case en la base (role_id, created_at) y camelCase en TypeScript.
      define: { underscored: true },
    });
  }

  static getInstance(): DatabaseConnection {
    if (DatabaseConnection.instance === null) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /** Instancia de Sequelize, para definir los modelos sobre esta misma conexión. */
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  /** Verifica que la base responda. Se llama una vez al iniciar la app. */
  async connect(): Promise<void> {
    await this.sequelize.authenticate();
  }

  /**
   * Crea las tablas de los modelos que todavía no existen.
   * (No hay migraciones porque sequelize-cli no está entre las librerías permitidas.)
   */
  async sync(): Promise<void> {
    await this.sequelize.sync();
  }

  /** Consulta liviana para saber si la base sigue disponible (la usa /api/health). */
  async isHealthy(): Promise<boolean> {
    try {
      await this.sequelize.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }
}
