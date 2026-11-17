import type { PermissionName, RoleName } from '../config/permissions';

/*
 * Tipos del dominio: objetos planos que viajan entre repositorios, services y
 * controllers. Los repositorios convierten los modelos de Sequelize a estos
 * tipos, así las capas de arriba no dependen de Sequelize.
 */

/** Datos públicos de un usuario (nunca incluye la contraseña). */
export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  createdAt: Date;
}

/** Usuario autenticado con sus permisos: lo que se guarda en req.user. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  permissions: PermissionName[];
}

/** Lo mínimo para validar un login. Solo lo usa AuthService. */
export interface UserCredentials {
  id: number;
  passwordHash: string;
}

export interface NewUserData {
  name: string;
  email: string;
  passwordHash: string;
  roleId: number;
}

export interface RoleSummary {
  id: number;
  name: RoleName;
}
