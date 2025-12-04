const mongoose = require('mongoose');
const logger = require('../config/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    logger.info(' MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', {
      message: error.message,
      stack: error.stack,
    });

    // crash the server — container/orchestrator will restart it
    process.exit(1);
  }
};

// -----------------------------------------
// Extra: Log important Mongo events
// -----------------------------------------
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
