// Backend/middleware/error.middleware.js
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  // Standardize error shape
  const status = err.statusCode || 500;
  const safeMessage = err.expose
    ? err.message
    : status === 500
      ? 'Internal Server Error'
      : err.message;

  // Log full error with route and user info if available
  logger.error('Error: %o', {
    message: err.message,
    status,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    user: req.user ? { id: req.user._id, email: req.user.email } : undefined,
    body: req.body,
  });

  res.status(status).json({
    success: false,
    message: safeMessage,
  });
};
