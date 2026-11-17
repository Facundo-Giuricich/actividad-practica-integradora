import { PermissionModel, RoleModel, UserModel } from '../models';
import type { AuthUser, NewUserData, UserCredentials, UserSummary } from '../types/user';
import type { IUserRepository } from './interfaces/IUserRepository';

/**
 * Implementación con Sequelize. Es el único lugar que toca UserModel, y siempre
 * devuelve objetos planos del dominio (nunca el modelo ni el hash a quien no lo necesita).
 */
export class UserRepository implements IUserRepository {
  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = await UserModel.findOne({ where: { email }, attributes: ['id', 'passwordHash'] });
    return user ? { id: user.id, passwordHash: user.passwordHash } : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.count({ where: { email } });
    return count > 0;
  }

  async findAuthById(id: number): Promise<AuthUser | null> {
    const user = await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          as: 'role',
          include: [{ model: PermissionModel, as: 'permissions', through: { attributes: [] } }],
        },
      ],
    });
    if (!user) return null;

    const role = requireRole(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role.name,
      permissions: (role.permissions ?? []).map((permission) => permission.name),
    };
  }

  async findAll(): Promise<UserSummary[]> {
    const users = await UserModel.findAll({
      include: [{ model: RoleModel, as: 'role' }],
      order: [['id', 'ASC']],
    });
    return users.map(toSummary);
  }

  async create(data: NewUserData): Promise<UserSummary> {
    const created = await UserModel.create(data);
    const summary = await this.findSummaryById(created.id);
    if (!summary) throw new Error(`No se encontró el usuario recién creado (id ${created.id})`);
    return summary;
  }

  async updateRole(userId: number, roleId: number): Promise<UserSummary | null> {
    const [affectedRows] = await UserModel.update({ roleId }, { where: { id: userId } });
    if (affectedRows === 0) return null;
    return this.findSummaryById(userId);
  }

  private async findSummaryById(id: number): Promise<UserSummary | null> {
    const user = await UserModel.findByPk(id, { include: [{ model: RoleModel, as: 'role' }] });
    return user ? toSummary(user) : null;
  }
}

/** role_id es NOT NULL con FK, así que si la consulta incluyó el rol, siempre está. */
function requireRole(user: UserModel): RoleModel {
  if (!user.role) throw new Error(`El usuario ${user.id} no tiene rol cargado en la consulta`);
  return user.role;
}

function toSummary(user: UserModel): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: requireRole(user).name,
    createdAt: user.createdAt,
  };
}
