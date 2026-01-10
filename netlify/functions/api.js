const serverless = require('serverless-http');
const express = require('express');
const app = require('../../backend/server');

// This ensures that Netlify properly routes the /api/* paths to our Express app
module.exports.handler = serverless(app, {
  basePath: '/api'
});
