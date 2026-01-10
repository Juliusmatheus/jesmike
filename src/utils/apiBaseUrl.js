export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL;
  const trimmed = raw && String(raw).trim();

  const normalize = (value) => String(value).trim().replace(/\/+$/, '');

  // If explicitly configured, use it (trim whitespace + trailing slashes)
  // NOTE: On Vercel, "DEPLOYMENT_NOT_FOUND" often happens when the frontend is built
  // with a stale/incorrect *.vercel.app URL (e.g. an old preview deployment) and keeps
  // calling that host. In production we prefer same-origin by default, and only honor
  // REACT_APP_API_URL when it is safe/intentional.
  if (trimmed) {
    // Production: default to same-origin unless a non-stale host is explicitly configured.
    if (process.env.NODE_ENV === 'production') {
      try {
        const url = new URL(trimmed);

        // If someone set REACT_APP_API_URL to a Vercel deployment host that doesn't match
        // the currently served host, ignore it and fall back to same-origin.
        if (typeof window !== 'undefined') {
          const currentHost = window.location.hostname;
          const isVercelHost = /(^|\.)vercel\.app$/i.test(url.hostname);
          if (isVercelHost && url.hostname !== currentHost) {
            return '';
          }
        }

        return normalize(trimmed);
      } catch {
        // Invalid URL in production: safer to ignore and use same-origin.
        return '';
      }
    }

    // Dev/test: allow overriding to point at a local backend.
    return normalize(trimmed);
  }

  // If we are running on a .netlify.app domain, always use same-origin
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return '';
  }

  // Default: in production use same-origin (Netlify will serve /api/*)
  if (process.env.NODE_ENV === 'production') return '';

  // Default dev backend
  return 'http://localhost:5002';
}




