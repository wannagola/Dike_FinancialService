const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000';

export function getToken() {
  return localStorage.getItem('access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) { clearTokens(); return false; }
  const json = await res.json();
  setTokens(json.data.access_token, json.data.refresh_token);
  return true;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE}${path}`, { ...options, headers });
    } else {
      throw Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED' });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // FastAPI wraps detail in { detail: { code, message } }
    const err = body.detail ?? body;
    throw Object.assign(new Error(err.message ?? 'API Error'), { code: err.code ?? 'ERR' });
  }

  return res.json() as Promise<T>;
}
