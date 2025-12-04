// Backend/config/logger.js
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // include stack trace
    format.splat(),
    format.json(),
  ),
  transports: [
    // Console transport (for dev); keep it human friendly when NODE_ENV !== production
    new transports.Console({
      silent: process.env.NODE_ENV === 'test    ',
      format:
        process.env.NODE_ENV === 'production'
          ? format.combine(format.colorize(false), format.simple())
          : format.combine(format.colorize(), format.simple()),
    }),

    // Daily rotating file for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'info',
      zippedArchive: false,
    }),

    // Separate errors file
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: false,
    }),
  ],
  exceptionHandlers: [
    // ensures uncaught exceptions are logged
    new transports.File({ filename: path.join(logDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    // ensures unhandled rejections are logged
    new transports.File({ filename: path.join(logDir, 'rejections.log') }),
  ],
});

// silence logs during tests
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach((t) => (t.silent = true));
}

module.exports = logger;
