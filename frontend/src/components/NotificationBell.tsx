import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { NOTIFICATIONS_CHANGED, notificationsApi } from '../api/notifications.api';

/** Cada cuánto se consulta el contador (polling; la consigna lo acepta). */
const POLL_INTERVAL_MS = 5000;

/** Enlace a la bandeja con el contador de notificaciones no leídas. */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then(({ count: unread }) => setCount(unread))
      .catch(() => {
        // Un error puntual de red no debe romper la barra: se reintenta en el próximo ciclo.
      });
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
    };
  }, [refresh]);

  return (
    <NavLink to="/notificaciones" className="bell" aria-label={`Notificaciones: ${count} sin leer`}>
      Notificaciones
      {count > 0 && <span className="badge-count">{count}</span>}
    </NavLink>
  );
}
