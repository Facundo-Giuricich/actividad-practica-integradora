import type { RoleName } from '../config/permissions';
import { AppError } from '../errors/AppError';
import type { IRoleRepository } from '../repositories/interfaces/IRoleRepository';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository';
import type { RoleSummary, UserSummary } from '../types/user';

/** Administración de usuarios (RF6): listar usuarios y asignarles un rol. */
export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
  ) {}

  listUsers(): Promise<UserSummary[]> {
    return this.users.findAll();
  }

  listRoles(): Promise<RoleSummary[]> {
    return this.roles.findAll();
  }

  async assignRole(actorId: number, targetUserId: number, roleName: RoleName): Promise<UserSummary> {
    // Evita que un admin se quite su propio rol y deje el sistema sin administrador.
    if (actorId === targetUserId) {
      throw new AppError('VALIDATION', 'No podés cambiar tu propio rol');
    }

    const role = await this.roles.findByName(roleName);
    if (!role) throw new AppError('NOT_FOUND', `No existe el rol "${roleName}"`);

    const updated = await this.users.updateRole(targetUserId, role.id);
    if (!updated) throw new AppError('NOT_FOUND', `No existe el usuario ${targetUserId}`);
    return updated;
  }
}
