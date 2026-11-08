const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'apepara.token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const imageUrl = (path) => (path ? `${BASE}${path}` : null);

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method, headers, body: formData ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const detail = data.details?.map((d) => d.message).join(' ');
    throw new Error(detail || data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (b) => request('/api/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/api/auth/login', { method: 'POST', body: b }),
  me: () => request('/api/auth/me'),
  listReports: (qs = '') => request(`/api/reports${qs}`),
  createReport: (formData) => request('/api/reports', { method: 'POST', formData }),
  updateStatus: (id, status) => request(`/api/reports/${id}/status`, { method: 'PATCH', body: { status } }),
  resolveDepartment: ({ lat, lng, category }) =>
    request(`/api/departments/resolve?lat=${lat}&lng=${lng}&category=${category}`),
  notifications: () => request('/api/notifications'),
  markNotificationsRead: () => request('/api/notifications/read', { method: 'POST' }),
};
