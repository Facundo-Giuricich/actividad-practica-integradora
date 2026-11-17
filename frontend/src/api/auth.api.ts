import type { AuthResult, AuthUser } from '../types';
import { apiFetch } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthResult>('POST', '/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    apiFetch<AuthResult>('POST', '/auth/register', { name, email, password }),

  me: () => apiFetch<{ user: AuthUser }>('GET', '/auth/me'),
};
