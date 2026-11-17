/**
 * Catálogo de roles y permisos (tabla RF2 de la consigna, con "recurso" = "libro").
 *
 * Es la única fuente de verdad: el seed lo usa para cargar la base, y las rutas
 * lo usan en authorize(). Como son tipos literales, escribir mal un permiso
 * (por ejemplo 'libro:raed') es un error de compilación, no un bug en runtime.
 */

export const ROLES = ['admin', 'operador', 'usuario'] as const;
export type RoleName = (typeof ROLES)[number];

/** Rol con el que se crea todo usuario que se registra (RF2). */
export const DEFAULT_ROLE: RoleName = 'usuario';

export const PERMISSIONS = {
  LIBRO_READ: 'libro:read',
  LIBRO_CREATE: 'libro:create',
  LIBRO_UPDATE: 'libro:update',
  LIBRO_CHANGE_STATUS: 'libro:change-status',
  LIBRO_DELETE: 'libro:delete',
  SUBSCRIPTION_CREATE: 'subscription:create',
  SUBSCRIPTION_DELETE: 'subscription:delete',
  NOTIFICATION_READ: 'notification:read',
  USER_READ: 'user:read',
  USER_ASSIGN_ROLE: 'user:assign-role',
} as const;
export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

/** Qué permisos tiene cada rol. */
export const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  admin: Object.values(P),
  operador: [
    P.LIBRO_READ,
    P.LIBRO_CREATE,
    P.LIBRO_UPDATE,
    P.LIBRO_CHANGE_STATUS,
    P.SUBSCRIPTION_CREATE,
    P.SUBSCRIPTION_DELETE,
    P.NOTIFICATION_READ,
  ],
  usuario: [P.LIBRO_READ, P.SUBSCRIPTION_CREATE, P.SUBSCRIPTION_DELETE, P.NOTIFICATION_READ],
};

export function isRoleName(value: string): value is RoleName {
  return (ROLES as readonly string[]).includes(value);
}
