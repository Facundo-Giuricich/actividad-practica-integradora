import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import type { RoleModel } from './Role';

/** Tabla "users". Cada usuario tiene exactamente un rol (role_id). */
export class UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: ForeignKey<RoleModel['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Solo existe si la consulta incluye la asociación "role".
  declare role?: NonAttribute<RoleModel>;
}

export function initUserModel(sequelize: Sequelize): void {
  UserModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      roleId: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: 'users' },
  );
}
