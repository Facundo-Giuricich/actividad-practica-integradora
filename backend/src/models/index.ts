import type { Sequelize } from 'sequelize';
import { PermissionModel, initPermissionModel } from './Permission';
import { RoleModel, initRoleModel } from './Role';
import { UserModel, initUserModel } from './User';

/**
 * Registra todos los modelos sobre la conexión única (la de DatabaseConnection)
 * y declara las relaciones entre ellos. Se llama una vez desde main.ts.
 */
export function initModels(sequelize: Sequelize): void {
  initPermissionModel(sequelize);
  initRoleModel(sequelize);
  initUserModel(sequelize);

  // Rol N ── M Permiso, a través de la tabla intermedia role_permissions.
  RoleModel.belongsToMany(PermissionModel, {
    through: 'role_permissions',
    as: 'permissions',
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    timestamps: false,
  });
  PermissionModel.belongsToMany(RoleModel, {
    through: 'role_permissions',
    as: 'roles',
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    timestamps: false,
  });

  // Rol 1 ── N Usuario.
  RoleModel.hasMany(UserModel, { foreignKey: 'roleId', as: 'users' });
  UserModel.belongsTo(RoleModel, { foreignKey: 'roleId', as: 'role' });
}

export { PermissionModel, RoleModel, UserModel };
