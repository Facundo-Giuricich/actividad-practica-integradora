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
import type { LibroModel } from './Libro';
import type { UserModel } from './User';

/**
 * Tabla "subscriptions": qué usuario sigue qué libro.
 * Ojo: esto es un DATO persistido, no el "observer" del patrón Observer.
 */
export class SubscriptionModel extends Model<
  InferAttributes<SubscriptionModel>,
  InferCreationAttributes<SubscriptionModel>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<UserModel['id']>;
  declare libroId: ForeignKey<LibroModel['id']>;
  declare createdAt: CreationOptional<Date>;

  // Solo existen si la consulta incluye la asociación.
  declare libro?: NonAttribute<LibroModel>;
  declare user?: NonAttribute<UserModel>;
}

export function initSubscriptionModel(sequelize: Sequelize): void {
  SubscriptionModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      libroId: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'subscriptions',
      updatedAt: false,
      // Un usuario no puede suscribirse dos veces al mismo libro (lo garantiza la base).
      indexes: [{ unique: true, fields: ['user_id', 'libro_id'] }],
    },
  );
}
