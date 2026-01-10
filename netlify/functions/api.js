const serverless = require('serverless-http');
const express = require('express');

let app;
try {
  // Try to load the backend
  app = require('../../backend/server');
} catch (err) {
  console.error('CRITICAL ERROR:', err);
  
  // Create a "Backup" app to show you the error message on the screen
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ 
      success: false,
      error: 'Backend Error: ' + err.message, // This will show in the red box
      details: err.stack
    });
  });
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return await handler(event, context);
};
