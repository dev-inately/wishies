const mongoose = require('mongoose');

const { logger, DATABASE_URL } = require('../config');

let pool;
const moongoseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connect = async () => {
  try {
    const connection = await mongoose.connect(`${DATABASE_URL}`, moongoseConfig);
    pool = connection;
    logger.info('DATABASE connected successfully!');
  } catch (error) {
    logger.error('DATABASE connection failed! Exiting Now');
    logger.error(error);
    process.emit('SIGTERM');
    process.exit(1);
  }
  return true;
};

const getPool = () => pool;

module.exports = { connect, getPool };
