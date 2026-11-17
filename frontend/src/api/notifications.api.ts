import type { InboxNotification } from '../types';
import { apiFetch, apiSend } from './client';

/**
 * Evento del navegador que se dispara cuando el usuario marca notificaciones
 * como leídas, para que la campanita actualice el contador sin esperar al polling.
 */
export const NOTIFICATIONS_CHANGED = 'notifications:changed';

export function announceNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export const notificationsApi = {
  list: () => apiFetch<InboxNotification[]>('GET', '/notifications'),
  unreadCount: () => apiFetch<{ count: number }>('GET', '/notifications/unread-count'),
  markAsRead: (id: number) => apiSend('PATCH', `/notifications/${id}/read`),
  markAllAsRead: () => apiFetch<{ updated: number }>('PATCH', '/notifications/read-all'),
};
