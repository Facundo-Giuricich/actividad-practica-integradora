/**
 * Función base para hablar con la API usando fetch nativo.
 * - Agrega el JWT guardado en el header Authorization.
 * - Convierte las respuestas de error ({ error: "..." }) en un ApiError.
 * - Si la API responde 401 (token vencido o inválido), avisa para cerrar sesión.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'tp_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;

/** AuthContext registra acá qué hacer cuando la sesión deja de ser válida. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request(method: HttpMethod, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // La respuesta no era JSON: se usa el mensaje genérico.
  }
  return `Error ${response.status}`;
}

/** Para endpoints que devuelven datos (JSON). */
export async function apiFetch<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const response = await request(method, path, body);
  const data: unknown = await response.json();
  // Cast justificado: confiamos en el contrato de la API (los tipos de src/types reflejan al backend).
  return data as T;
}

/** Para endpoints que no devuelven contenido (204). */
export async function apiSend(method: HttpMethod, path: string, body?: unknown): Promise<void> {
  await request(method, path, body);
}
