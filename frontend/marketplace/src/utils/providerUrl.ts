// Override this URL with the deployed Provider origin in production.
export function providerUrl(path: '/signup' | '/login') {
  const configured = import.meta.env.VITE_PROVIDER_URL?.trim();
  const fallback = new URL(window.location.origin);
  fallback.port = '5173';
  return `${(configured || fallback.origin).replace(/\/+$/, '')}${path}`;
}
