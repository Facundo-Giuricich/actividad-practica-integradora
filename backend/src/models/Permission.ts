import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { PERMISSIONS, type PermissionName } from '../config/permissions';

/** Tabla "permissions": un permiso con forma recurso:accion (ej. libro:create). */
export class PermissionModel extends Model<InferAttributes<PermissionModel>, InferCreationAttributes<PermissionModel>> {
  declare id: CreationOptional<number>;
  declare name: PermissionName;
}

export function initPermissionModel(sequelize: Sequelize): void {
  PermissionModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        validate: { isIn: [Object.values(PERMISSIONS)] },
      },
    },
    { sequelize, tableName: 'permissions', timestamps: false },
  );
}
