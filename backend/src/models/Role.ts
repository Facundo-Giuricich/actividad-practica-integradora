import {
  DataTypes,
  Model,
  type BelongsToManySetAssociationsMixin,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import { ROLES, type RoleName } from '../config/permissions';
import type { PermissionModel } from './Permission';

/** Tabla "roles". Se relaciona con permisos de muchos a muchos (tabla role_permissions). */
export class RoleModel extends Model<InferAttributes<RoleModel>, InferCreationAttributes<RoleModel>> {
  declare id: CreationOptional<number>;
  declare name: RoleName;

  // Solo existe si la consulta incluye la asociación "permissions".
  declare permissions?: NonAttribute<PermissionModel[]>;

  // Método que Sequelize agrega al declarar belongsToMany (lo usa el seed).
  declare setPermissions: BelongsToManySetAssociationsMixin<PermissionModel, number>;
}

export function initRoleModel(sequelize: Sequelize): void {
  RoleModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        validate: { isIn: [[...ROLES]] },
      },
    },
    { sequelize, tableName: 'roles', timestamps: false },
  );
}
