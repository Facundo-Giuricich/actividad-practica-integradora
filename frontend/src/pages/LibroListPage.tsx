import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { librosApi } from '../api/libros.api';
import { Can } from '../components/Can';
import { StatusBadge } from '../components/StatusBadge';
import type { Libro } from '../types';
import { errorMessage } from '../utils/format';

export function LibroListPage() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([librosApi.list(), librosApi.mySubscriptions()])
      .then(([list, subscriptions]) => {
        setLibros(list);
        setSubscribedIds(new Set(subscriptions.map((s) => s.libroId)));
      })
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Libros</h1>
        <Can permission="libro:create">
          <Link to="/libros/nuevo" className="button">
            Nuevo libro
          </Link>
        </Can>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && libros.length === 0 && <p className="muted">Todavía no hay libros cargados.</p>}

      {libros.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Estado</th>
              <th>Suscripción</th>
            </tr>
          </thead>
          <tbody>
            {libros.map((libro) => (
              <tr key={libro.id}>
                <td>
                  <Link to={`/libros/${libro.id}`}>{libro.title}</Link>
                </td>
                <td>{libro.author}</td>
                <td>
                  <StatusBadge status={libro.status} />
                </td>
                <td>{subscribedIds.has(libro.id) ? <span className="tag">Suscripto</span> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
