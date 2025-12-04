require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const morgan = require('morgan');

// Routes
const userRoutes = require('./routes/user.route');
const restaurantRoutes = require('./routes/restaurant.route');
const orderRoutes = require('./routes/order.routes');

const app = express();

// ------------------------------
// 1) Logging (Morgan → Winston)
// ------------------------------
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }),
);

// ------------------------------
// 2) Global Middlewares
// ------------------------------
// Configure Helmet but allow cross-origin resource sharing for static assets
// by setting Cross-Origin-Resource-Policy to 'cross-origin'.
// Without this, Helmet may send a `Cross-Origin-Resource-Policy: same-origin`
// header which causes browsers to block images requested from a different origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prevent parameter pollution
app.use(hpp());

// Middleware to add explicit CORS headers to static assets
// This ensures 304 (Not Modified) responses also include the necessary headers
// and allows the browser preflight (OPTIONS) to accept POST/PUT/DELETE requests.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Allow common HTTP methods from the frontend
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  // Allow common headers including Authorization for Bearer tokens
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve images with no-cache to force full responses (not 304s) and ensure all headers are sent
app.use(
  '/img',
  express.static(path.join(__dirname, 'public/img'), {
    maxAge: 0, // Disable caching to force full 200 responses
    etag: false, // Disable ETag to prevent 304 Not Modified responses
  }),
);

// ------------------------------
// 3) Routes
// ------------------------------
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/order', orderRoutes);

// ------------------------------
// 4) Global Error Handler
// ------------------------------
// Note: Express error-handling middleware must have four arguments: (err, req, res, next)
// Using the wrong signature causes the middleware to be treated as a regular middleware
// and can break responses (for example, returning 500 for static assets). Fixing the
// signature prevents the error handler from running for non-error requests.
app.use((err, req, res, next) => {
  try {
    logger.error('Unhandled Error: %o', {
      message: err && err.message,
      stack: err && err.stack,
      route: req && req.originalUrl,
      method: req && req.method,
      body: req && req.body,
    });

    const status = (err && err.statusCode) || 500;

    res.status(status).json({
      success: false,
      message: status === 500 ? 'Internal Server Error' : err.message,
    });
  } catch (loggingError) {
    // If the error handler itself fails, delegate to default Express error handler
    // and avoid crashing the process.
    next(loggingError);
  }
});

module.exports = app;
