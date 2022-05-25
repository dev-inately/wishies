const app = require('./src/app');
const db = require('./src/db');
const config = require('./config');

const startApp = async () => {
  try {
    config.logger.info('Waiting for DATABASE Connection...');
    await db.connect();
    // Start Listening on the http server on PORT
    app.listen(config.APP_PORT, () => config.logger.info(
      `Env: ${config.NODE_ENV}: ${config.APP_NAME} Server started on PORT ${config.APP_PORT}`,
    ));
  } catch (err) {
    config.logger.error(err.stack);
    process.emit('SIGTERM');
  }
};

startApp();
