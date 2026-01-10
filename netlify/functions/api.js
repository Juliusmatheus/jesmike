const serverless = require('serverless-http');
const app = require('../../backend/server');

// Standard wrapper for Netlify functions
module.exports.handler = serverless(app);
