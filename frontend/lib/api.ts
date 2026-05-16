import type { AuthResponse } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('agforest_token');
}

export function setSession(auth: AuthResponse) {
  window.localStorage.setItem('agforest_token', auth.access_token);
  window.localStorage.setItem('agforest_user', JSON.stringify(auth.user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('agforest_token');
  window.localStorage.removeItem('agforest_user');
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401) clearSession();
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      message = await response.text();
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);
  const auth = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  setSession(auth);
  return auth;
}

export async function register(email: string, password: string, fullName: string) {
  const auth = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  setSession(auth);
  return auth;
}

export async function downloadReport(reportId: number, kind: 'pdf' | 'html') {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}/reports/${reportId}/export/${kind}`, { headers });
  if (!response.ok) throw new ApiError('No se pudo exportar el informe', response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `informe_${reportId}.${kind}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
