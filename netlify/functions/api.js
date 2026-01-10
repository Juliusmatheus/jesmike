const serverless = require('serverless-http');

// Use a try-catch during the require phase to see if the backend crashes on load
let app;
try {
  app = require('../../backend/server');
} catch (err) {
  console.error('CRITICAL: Failed to load backend/server.js:', err);
  // Create a minimal express app to report the error
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ 
      error: 'Backend failed to load', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Add some logging for debugging
  console.log('Function invoked:', event.path, event.httpMethod);
  
  try {
    return await handler(event, context);
  } catch (err) {
    console.error('Function Execution Error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ 
        error: 'Netlify Function Execution Error', 
        details: err.message 
      })
    };
  }
};
