import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { announceNotificationsChanged, notificationsApi } from '../api/notifications.api';
import type { InboxNotification } from '../types';
import { errorMessage, formatDate } from '../utils/format';

/** Bandeja de notificaciones del usuario logueado (canal in-app). */
export function NotificationsPage() {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setNotifications(await notificationsApi.list());
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
      announceNotificationsChanged();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      announceNotificationsChanged();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <section>
      <div className="page-header">
        <h1>Notificaciones</h1>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => void load()}>
            Actualizar
          </button>
          <button type="button" disabled={unread === 0} onClick={() => void markAllAsRead()}>
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && notifications.length === 0 && (
        <p className="muted">
          No tenés notificaciones. Suscribite a un libro para enterarte cuando cambie de estado.
        </p>
      )}

      <ul className="inbox">
        {notifications.map((n) => (
          <li key={n.id} className={n.read ? 'read' : 'unread'}>
            <div>
              <p>{n.message}</p>
              <p className="muted small">
                {formatDate(n.createdAt)}
                {n.libroId !== null ? (
                  <>
                    {' · '}
                    <Link to={`/libros/${n.libroId}`}>Ver libro</Link>
                  </>
                ) : (
                  ' · El libro ya no existe'
                )}
              </p>
            </div>
            {!n.read && (
              <button type="button" className="secondary" onClick={() => void markAsRead(n.id)}>
                Marcar como leída
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
