const serverless = require('serverless-http');
const express = require('express');
const path = require('path');

let app;
try {
  // Use absolute path to ensure the bundler and runtime find it correctly
  const serverPath = path.resolve(__dirname, '../../backend/server');
  app = require(serverPath);
} catch (err) {
  console.error('CRITICAL ERROR LOADING BACKEND:', err);
  
  app = express();
  app.all('*', (req, res) => {
    // Put the error message directly in the "error" field so it shows in the UI toast
    res.status(500).json({ 
      success: false,
      error: `Backend Load Error: ${err.message}`,
      path: path.resolve(__dirname, '../../backend/server'),
      stack: err.stack
    });
  });
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return await handler(event, context);
};
