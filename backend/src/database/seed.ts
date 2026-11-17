import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, type RoleName } from '../config/permissions';
import { PermissionModel, RoleModel, UserModel } from '../models';
import { hashPassword } from '../utils/password';

/** Usuarios de prueba (figuran en el README). */
const SEED_USERS: ReadonlyArray<{ name: string; email: string; password: string; role: RoleName }> = [
  { name: 'Administrador', email: 'admin@tp.com', password: 'admin123', role: 'admin' },
  { name: 'Operador', email: 'operador@tp.com', password: 'operador123', role: 'operador' },
  { name: 'Usuario', email: 'usuario@tp.com', password: 'usuario123', role: 'usuario' },
];

/**
 * Carga permisos, roles y usuarios de prueba. Se ejecuta en cada arranque y es
 * IDEMPOTENTE: si algo ya existe no lo duplica (findOrCreate), así que se puede
 * correr las veces que haga falta.
 *
 * Usa los modelos directamente (no los repositorios) porque no es parte del
 * flujo de la aplicación sino de la preparación de la base, como una migración.
 */
export async function runSeed(): Promise<void> {
  for (const name of Object.values(PERMISSIONS)) {
    await PermissionModel.findOrCreate({ where: { name } });
  }

  for (const roleName of ROLES) {
    const [role] = await RoleModel.findOrCreate({ where: { name: roleName } });
    const permissions = await PermissionModel.findAll({ where: { name: ROLE_PERMISSIONS[roleName] } });
    // setPermissions reemplaza la lista completa: si la tabla de permisos cambia, se actualiza.
    await role.setPermissions(permissions);
  }

  let createdUsers = 0;
  for (const seedUser of SEED_USERS) {
    const exists = await UserModel.count({ where: { email: seedUser.email } });
    if (exists > 0) continue;

    const role = await RoleModel.findOne({ where: { name: seedUser.role } });
    if (!role) throw new Error(`Seed: no existe el rol ${seedUser.role}`);
    await UserModel.create({
      name: seedUser.name,
      email: seedUser.email,
      passwordHash: await hashPassword(seedUser.password),
      roleId: role.id,
    });
    createdUsers++;
  }

  console.log(
    `[SEED] ${Object.values(PERMISSIONS).length} permisos, ${ROLES.length} roles, ` +
      `${createdUsers} usuarios de prueba nuevos`,
  );
}
