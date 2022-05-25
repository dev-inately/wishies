const pino = require('pino');

const {
  NODE_ENV, APP_NAME, DATABASE_URL, APP_PORT, APP_SECRET, ...rest
} = process.env;

let logger = pino();
if (NODE_ENV === 'development') {
  logger = pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
}

module.exports = {
  ...rest,
  NODE_ENV,
  APP_NAME,
  DATABASE_URL,
  APP_PORT,
  APP_SECRET,
  logger,
};
