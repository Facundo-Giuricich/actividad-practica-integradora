import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PermissionName } from '../types';

interface CanProps {
  permission: PermissionName;
  children: ReactNode;
  /** Qué mostrar si NO tiene el permiso (por defecto, nada). */
  fallback?: ReactNode;
}

/**
 * Muestra sus hijos solo si el usuario tiene el permiso.
 * Uso: <Can permission="libro:create"><button>Nuevo libro</button></Can>
 *
 * Es solo comodidad visual: aunque alguien fuerce el botón, el backend responde 403.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();
  return <>{hasPermission(permission) ? children : fallback}</>;
}
