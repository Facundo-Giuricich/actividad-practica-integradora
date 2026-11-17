import type { RoleName, RoleSummary, UserSummary } from '../types';
import { apiFetch } from './client';

export const usersApi = {
  list: () => apiFetch<UserSummary[]>('GET', '/users'),
  roles: () => apiFetch<RoleSummary[]>('GET', '/roles'),
  assignRole: (userId: number, role: RoleName) => apiFetch<UserSummary>('PATCH', `/users/${userId}/role`, { role }),
};
