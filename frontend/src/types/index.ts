/*
 * Tipos que devuelve la API. Reflejan los del backend; las fechas llegan como
 * texto ISO porque viajan en JSON.
 */

export type RoleName = 'admin' | 'operador' | 'usuario';

export type PermissionName =
  | 'libro:read'
  | 'libro:create'
  | 'libro:update'
  | 'libro:change-status'
  | 'libro:delete'
  | 'subscription:create'
  | 'subscription:delete'
  | 'notification:read'
  | 'user:read'
  | 'user:assign-role';

export const LIBRO_STATUSES = ['DISPONIBLE', 'PRESTADO', 'EN_REPARACION'] as const;
export type LibroStatus = (typeof LIBRO_STATUSES)[number];

export function isLibroStatus(value: string): value is LibroStatus {
  return (LIBRO_STATUSES as readonly string[]).includes(value);
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  permissions: PermissionName[];
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  createdAt: string;
}

export interface RoleSummary {
  id: number;
  name: RoleName;
}

export interface Libro {
  id: number;
  title: string;
  author: string;
  description: string;
  status: LibroStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LibroInput {
  title: string;
  author: string;
  description: string;
}

export interface LibroStatusChange {
  libro: Libro;
  previousStatus: LibroStatus;
}

export interface UserSubscription {
  libroId: number;
  createdAt: string;
  libro: { id: number; title: string; status: LibroStatus };
}

export interface InboxNotification {
  id: number;
  libroId: number | null;
  libroTitle: string;
  previousStatus: LibroStatus;
  newStatus: LibroStatus;
  message: string;
  read: boolean;
  createdAt: string;
}
