import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Can } from './Can';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <span className="brand">Biblioteca</span>
        <Can permission="libro:read">
          <NavLink to="/libros">Libros</NavLink>
        </Can>
        <Can permission="notification:read">
          <NotificationBell />
        </Can>
        <Can permission="user:read">
          <NavLink to="/admin/usuarios">Usuarios</NavLink>
        </Can>
        <span className="spacer" />
        <span className="who">
          {user.name} <span className={`role role-${user.role}`}>{user.role}</span>
        </span>
        <button type="button" className="link-button" onClick={handleLogout}>
          Salir
        </button>
      </nav>
    </header>
  );
}
