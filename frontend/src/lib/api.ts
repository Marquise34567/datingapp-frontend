const API = (import.meta.env.VITE_BACKEND_BASE_URL as string) || "https://api.sparkdd.live";

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  // In dev, prefer a relative `/api` path so Vite's dev server proxy can forward requests
  // to the configured backend and avoid browser CORS issues. In production, use the
  // configured absolute backend URL.
  const useRelative = import.meta.env.DEV;
  if (useRelative) {
    return `/api${p}`;
  }
  return `${API.replace(/\/$/, '')}/api${p}`;
}

export function apiFetch(path: string, opts?: RequestInit) {
  const url = apiUrl(path);
  const init = { credentials: 'include', ...opts } as RequestInit;
  return fetch(url, init);
}
