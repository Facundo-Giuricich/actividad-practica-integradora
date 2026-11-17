import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { DEFAULT_LIBRO_STATUS, LIBRO_STATUSES, type LibroStatus } from '../types/libro';

/** Tabla "libros": el recurso principal de la aplicación. */
export class LibroModel extends Model<InferAttributes<LibroModel>, InferCreationAttributes<LibroModel>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare author: string;
  declare description: string;
  declare status: CreationOptional<LibroStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initLibroModel(sequelize: Sequelize): void {
  LibroModel.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      author: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      // ENUM de PostgreSQL: la base misma rechaza un estado que no sea uno de los tres.
      status: {
        type: DataTypes.ENUM(...LIBRO_STATUSES),
        allowNull: false,
        defaultValue: DEFAULT_LIBRO_STATUS,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: 'libros' },
  );
}
