// Use Vite proxy in dev (/api → http://localhost:8000), relative path avoids CORS entirely
const BASE_URL = '/api';

export async function customFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required. Please log in.');
  }

  if (!res.ok) {
    // FastAPI returns { detail: "..." } for error responses
    const body = await res.json().catch(() => null);
    const message = body?.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}
