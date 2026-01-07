export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL;

  // If explicitly configured, use it (trim whitespace + trailing slashes)
  if (raw && String(raw).trim()) {
    return String(raw).trim().replace(/\/+$/, '');
  }

  // Default: in production use same-origin (Vercel will serve /api/*)
  if (process.env.NODE_ENV === 'production') return '';

  // Default dev backend
  return 'http://localhost:5002';
}




