// Vercel Serverless Function entrypoint.
// This wraps the existing Express app defined in backend/server.js.
const app = require('../backend/server');

module.exports = (req, res) => {
  // Some platforms may pass paths without the "/api" prefix.
  // Our Express routes are defined as "/api/...", so normalize here.
  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
};


