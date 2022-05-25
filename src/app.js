/* eslint-disable no-unused-vars */
require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const express = require('express');
const config = require('../config');
// Initialize the application
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send({ message: `Welcome to ${config.APP_NAME} server!!` }));

// Global 404 error handler
app.use((req, res, next) => {
  const response = {
    status: 'fail',
    error: {
      errorSource: '404_NOT_FOUND_ERROR',
    },
    message: 'You have entered a black hole, find your way out!',
  };
  return res.status(404).send(response);
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).send(err.message));

process.on('unhandledRejection', (error) => {
  config.logger.fatal({ err: error }, error.message);
  throw error;
});

module.exports = app;
