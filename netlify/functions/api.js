const serverless = require('serverless-http');
const express = require('express');
const path = require('path');

let app;
try {
  // Attempt 1: Standard relative path
  app = require('../../backend/server');
} catch (err) {
  try {
    // Attempt 2: Absolute path relative to task root
    app = require('/var/task/backend/server');
  } catch (err2) {
    console.error('CRITICAL ERROR LOADING BACKEND:', err2);
    
    app = express();
    app.all('*', (req, res) => {
      res.status(500).json({ 
        success: false,
        error: 'Backend missing on server. Please check netlify.toml included_files.',
        details: err2.message,
        triedPaths: ['../../backend/server', '/var/task/backend/server']
      });
    });
  }
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return await handler(event, context);
};
