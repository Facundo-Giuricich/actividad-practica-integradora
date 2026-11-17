import dotenv from 'dotenv';

// Carga el archivo .env si existe (ejecución local sin Docker).
// En Docker Compose las variables ya llegan por env_file, y dotenv no las pisa.
dotenv.config({ quiet: true });

/** Lee una variable obligatoria: si falta, la app no arranca (falla rápido y con un mensaje claro). */
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Falta la variable de entorno obligatoria ${name} (ver .env.example)`);
  }
  return value;
}

function requiredNumber(name: string): number {
  const raw = required(name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`La variable de entorno ${name} debe ser un entero positivo (valor recibido: "${raw}")`);
  }
  return value;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
}

export interface AppConfig {
  apiPort: number;
  db: DatabaseConfig;
}

/**
 * Configuración de la aplicación, validada una sola vez al importar el módulo.
 * El resto del código lee de acá y nunca toca process.env directamente.
 */
export const config: AppConfig = {
  apiPort: requiredNumber('API_PORT'),
  db: {
    host: required('DB_HOST'),
    port: requiredNumber('DB_PORT'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
  },
};
