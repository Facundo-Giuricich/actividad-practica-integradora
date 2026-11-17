import type { Libro, LibroInput, LibroStatus, LibroStatusChange, UserSubscription } from '../types';
import { apiFetch, apiSend } from './client';

export const librosApi = {
  list: () => apiFetch<Libro[]>('GET', '/libros'),
  get: (id: number) => apiFetch<Libro>('GET', `/libros/${id}`),
  create: (data: LibroInput & { status: LibroStatus }) => apiFetch<Libro>('POST', '/libros', data),
  update: (id: number, data: LibroInput) => apiFetch<Libro>('PUT', `/libros/${id}`, data),
  changeStatus: (id: number, status: LibroStatus) =>
    apiFetch<LibroStatusChange>('PATCH', `/libros/${id}/status`, { status }),
  remove: (id: number) => apiSend('DELETE', `/libros/${id}`),

  // Suscripciones (sub-recurso del libro).
  subscribe: (id: number) => apiSend('POST', `/libros/${id}/subscription`),
  unsubscribe: (id: number) => apiSend('DELETE', `/libros/${id}/subscription`),
  mySubscriptions: () => apiFetch<UserSubscription[]>('GET', '/subscriptions'),
};
