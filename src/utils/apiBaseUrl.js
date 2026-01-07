export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL || 'http://localhost:5002';
  // Guard against accidental spaces/newlines in .env.local
  return String(raw).trim().replace(/\/+$/, '');
}




