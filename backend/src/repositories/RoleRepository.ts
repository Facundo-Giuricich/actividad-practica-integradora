import { RoleModel } from '../models';
import type { RoleName } from '../config/permissions';
import type { RoleSummary } from '../types/user';
import type { IRoleRepository } from './interfaces/IRoleRepository';

export class RoleRepository implements IRoleRepository {
  async findByName(name: RoleName): Promise<RoleSummary | null> {
    const role = await RoleModel.findOne({ where: { name } });
    return role ? { id: role.id, name: role.name } : null;
  }

  async findAll(): Promise<RoleSummary[]> {
    const roles = await RoleModel.findAll({ order: [['id', 'ASC']] });
    return roles.map((role) => ({ id: role.id, name: role.name }));
  }
}
