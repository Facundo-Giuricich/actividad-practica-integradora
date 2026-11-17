import type { Sequelize } from 'sequelize';
import { LibroModel, initLibroModel } from './Libro';
import { NotificationModel, initNotificationModel } from './Notification';
import { PermissionModel, initPermissionModel } from './Permission';
import { RoleModel, initRoleModel } from './Role';
import { SubscriptionModel, initSubscriptionModel } from './Subscription';
import { UserModel, initUserModel } from './User';

/**
 * Registra todos los modelos sobre la conexión única (la de DatabaseConnection)
 * y declara las relaciones entre ellos. Se llama una vez desde main.ts.
 */
export function initModels(sequelize: Sequelize): void {
  initPermissionModel(sequelize);
  initRoleModel(sequelize);
  initUserModel(sequelize);
  initLibroModel(sequelize);
  initSubscriptionModel(sequelize);
  initNotificationModel(sequelize);

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

  // Usuario 1 ── N Suscripción N ── 1 Libro.
  // CASCADE: si se borra un libro (o un usuario), se borran sus suscripciones.
  UserModel.hasMany(SubscriptionModel, { foreignKey: 'userId', as: 'subscriptions', onDelete: 'CASCADE' });
  SubscriptionModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
  LibroModel.hasMany(SubscriptionModel, { foreignKey: 'libroId', as: 'subscriptions', onDelete: 'CASCADE' });
  SubscriptionModel.belongsTo(LibroModel, { foreignKey: 'libroId', as: 'libro', onDelete: 'CASCADE' });

  // Usuario 1 ── N Notificación. Si se borra el usuario, se borra su bandeja.
  UserModel.hasMany(NotificationModel, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
  NotificationModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
  // Libro 1 ── N Notificación. Si se borra el libro, la notificación queda (libro_id = NULL).
  LibroModel.hasMany(NotificationModel, { foreignKey: 'libroId', as: 'notifications', onDelete: 'SET NULL' });
  NotificationModel.belongsTo(LibroModel, { foreignKey: 'libroId', as: 'libro', onDelete: 'SET NULL' });
}

export { LibroModel, NotificationModel, PermissionModel, RoleModel, SubscriptionModel, UserModel };
