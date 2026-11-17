import type { AuthUser, NewUserData, UserCredentials, UserSummary } from '../../types/user';

/**
 * Contrato de acceso a usuarios. Los services dependen de ESTA interfaz, no de
 * la clase concreta que usa Sequelize (principio de inversión de dependencias).
 */
export interface IUserRepository {
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  existsByEmail(email: string): Promise<boolean>;
  findAuthById(id: number): Promise<AuthUser | null>;
  findAll(): Promise<UserSummary[]>;
  create(data: NewUserData): Promise<UserSummary>;
  /** Devuelve el usuario actualizado, o null si no existe. */
  updateRole(userId: number, roleId: number): Promise<UserSummary | null>;
}
