import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { PermissionName } from '../types';

interface ProtectedRouteProps {
  /** Permiso necesario para ver la página. Si se omite, alcanza con estar logueado. */
  permission?: PermissionName;
}

/** Sin sesión → redirige al login. Con sesión pero sin permiso → aviso de acceso denegado. */
export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted center">Cargando…</p>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <section className="card">
        <h1>Acceso denegado</h1>
        <p>
          Tu rol (<strong>{user.role}</strong>) no tiene el permiso <code>{permission}</code>.
        </p>
      </section>
    );
  }

  return <Outlet />;
}
