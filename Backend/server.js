require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Start Server After DB Connect
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(` Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  });

// Handle server errors
server.on('error', (err) => {
  logger.error('Server Error', err);
});
