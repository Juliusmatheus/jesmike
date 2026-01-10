const serverless = require('serverless-http');
const express = require('express');

let app;
try {
  // Use a simple relative path so Netlify's bundler can find the file
  app = require('../../backend/server');
} catch (err) {
  console.error('CRITICAL ERROR:', err);
  
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ 
      success: false,
      error: 'Backend Error: ' + err.message,
      stack: err.stack
    });
  });
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return await handler(event, context);
};
