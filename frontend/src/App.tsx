import { Link, Navigate, Route, Routes } from 'react-router';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { LibroDetailPage } from './pages/LibroDetailPage';
import { LibroFormPage } from './pages/LibroFormPage';
import { LibroListPage } from './pages/LibroListPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * Definición de rutas. Cada ruta protegida declara el permiso que necesita,
 * con el mismo nombre que usa el backend (libro:create, user:read, ...).
 */
export function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/libros" replace />} />

          <Route element={<ProtectedRoute permission="libro:read" />}>
            <Route path="/libros" element={<LibroListPage />} />
            <Route path="/libros/:id" element={<LibroDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="libro:create" />}>
            <Route path="/libros/nuevo" element={<LibroFormPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="libro:update" />}>
            <Route path="/libros/:id/editar" element={<LibroFormPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="notification:read" />}>
            <Route path="/notificaciones" element={<NotificationsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="user:read" />}>
            <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          </Route>

          <Route
            path="*"
            element={
              <section className="card">
                <h1>Página no encontrada</h1>
                <Link to="/libros">Ir a libros</Link>
              </section>
            }
          />
        </Routes>
      </main>
    </>
  );
}
