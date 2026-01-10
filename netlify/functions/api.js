const serverless = require('serverless-http');
const express = require('express');

let app;
try {
  // Use simple relative path
  app = require('../../backend/server');
} catch (err) {
  console.error('CRITICAL BACKEND LOAD ERROR:', err);
  
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ 
      success: false,
      error: 'Backend initialization failed. This is usually due to a missing dependency or a file path issue.',
      details: err.message,
      env: {
        dir: __dirname,
        node: process.version,
        platform: process.platform
      }
    });
  });
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Fix for Netlify: handle base64 encoded binary uploads (images/PDFs)
  // serverless-http handles this but we need to ensure the event is passed correctly
  return await handler(event, context);
};
