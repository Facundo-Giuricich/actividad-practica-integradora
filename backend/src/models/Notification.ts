import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { LIBRO_STATUSES, type LibroStatus } from '../types/libro';
import type { LibroModel } from './Libro';
import type { UserModel } from './User';

/** Tabla "notifications": la bandeja in-app de cada usuario. */
export class NotificationModel extends Model<
  InferAttributes<NotificationModel>,
  InferCreationAttributes<NotificationModel>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<UserModel['id']>;
  // Puede quedar en null si el libro se elimina: la notificación se conserva.
  declare libroId: ForeignKey<LibroModel['id']> | null;
  // Copia del título al momento de notificar (sigue legible aunque se borre el libro).
  declare libroTitle: string;
  declare previousStatus: LibroStatus;
  declare newStatus: LibroStatus;
  declare message: string;
  declare read: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
}

export function initNotificationModel(sequelize: Sequelize): void {
  NotificationModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      libroId: { type: DataTypes.INTEGER, allowNull: true },
      libroTitle: { type: DataTypes.STRING(200), allowNull: false },
      previousStatus: { type: DataTypes.ENUM(...LIBRO_STATUSES), allowNull: false },
      newStatus: { type: DataTypes.ENUM(...LIBRO_STATUSES), allowNull: false },
      message: { type: DataTypes.STRING(500), allowNull: false },
      read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: DataTypes.DATE,
    },
    { sequelize, tableName: 'notifications', updatedAt: false },
  );
}
