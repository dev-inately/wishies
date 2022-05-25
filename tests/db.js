const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongod = new MongoMemoryServer();

let connection;

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
  const uri = await mongod.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  connection = await mongoose.connect(uri, mongooseOpts);
  return connection;
};

/**
 * Get connection
 */
module.exports.getDB = () => connection;

/**
 * Drop database, close the connection and stop mongod.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/**
 * Remove all the data for all db collections.
 */
module.exports.clearDatabase = async () => {
  const { collections } = mongoose.connection;
  Object.keys(collections).forEach(async (key) => {
    await collections[key].deleteMany();
  });
};
