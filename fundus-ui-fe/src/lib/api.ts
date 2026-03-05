// Use Vite proxy in dev (/api → http://localhost:8000), relative path avoids CORS entirely
const BASE_URL = '/api';

export async function customFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
  });
  
  if (res.status === 401) {
    // Handle global 401 unauth
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'API request failed');
  }
  return res.json();
}
