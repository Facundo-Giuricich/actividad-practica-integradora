import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { librosApi } from '../api/libros.api';
import { Can } from '../components/Can';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { LIBRO_STATUSES, isLibroStatus, type Libro, type LibroStatus } from '../types';
import { errorMessage, formatDate, statusLabel } from '../utils/format';

export function LibroDetailPage() {
  const { id } = useParams();
  const libroId = Number(id);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [libro, setLibro] = useState<Libro | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [newStatus, setNewStatus] = useState<LibroStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, subscriptions] = await Promise.all([librosApi.get(libroId), librosApi.mySubscriptions()]);
      setLibro(data);
      setSubscribed(subscriptions.some((s) => s.libroId === libroId));
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, [libroId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Ejecuta una acción, muestra el resultado y recarga el libro. */
  const run = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
      setInfo(successMessage);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleChangeStatus = () => {
    if (!newStatus) return;
    void run(async () => {
      await librosApi.changeStatus(libroId, newStatus);
      setNewStatus('');
    }, `Estado cambiado a ${statusLabel(newStatus)}. Se notificó a los suscriptores.`);
  };

  const handleDelete = async () => {
    if (!libro || !window.confirm(`¿Eliminar "${libro.title}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await librosApi.remove(libroId);
      navigate('/libros', { replace: true });
    } catch (err: unknown) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (!libro) {
    return (
      <section>
        {error ? <p className="error">{error}</p> : <p className="muted">Cargando…</p>}
        <Link to="/libros">← Volver a libros</Link>
      </section>
    );
  }

  const otherStatuses = LIBRO_STATUSES.filter((s) => s !== libro.status);

  return (
    <section>
      <Link to="/libros">← Volver a libros</Link>

      <article className="card">
        <div className="page-header">
          <div>
            <h1>{libro.title}</h1>
            <p className="muted">{libro.author}</p>
          </div>
          <StatusBadge status={libro.status} />
        </div>
        <p className="description">{libro.description}</p>
        <p className="muted small">
          Libro #{libro.id} · Creado {formatDate(libro.createdAt)} · Actualizado {formatDate(libro.updatedAt)}
        </p>

        {info && <p className="success">{info}</p>}
        {error && <p className="error">{error}</p>}

        <div className="actions">
          {subscribed ? (
            <Can permission="subscription:delete">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => void run(() => librosApi.unsubscribe(libroId), 'Te desuscribiste de este libro.')}
              >
                Desuscribirse
              </button>
            </Can>
          ) : (
            <Can permission="subscription:create">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() => librosApi.subscribe(libroId), 'Te suscribiste: vas a recibir avisos de cambios de estado.')
                }
              >
                Suscribirse
              </button>
            </Can>
          )}

          <Can permission="libro:update">
            <Link to={`/libros/${libro.id}/editar`} className="button secondary">
              Editar
            </Link>
          </Can>

          <Can permission="libro:delete">
            <button type="button" className="danger" disabled={busy} onClick={() => void handleDelete()}>
              Eliminar
            </button>
          </Can>
        </div>

        {hasPermission('libro:change-status') && (
          <div className="status-change">
            <label>
              Cambiar estado
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(isLibroStatus(e.target.value) ? e.target.value : '')}
              >
                <option value="">Elegí un estado…</option>
                {otherStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" disabled={busy || !newStatus} onClick={handleChangeStatus}>
              Aplicar
            </button>
          </div>
        )}
      </article>
    </section>
  );
}
