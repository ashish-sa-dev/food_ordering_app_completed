
// 1. Load Environment Variables First

const dotenv = require("dotenv");
dotenv.config();
const path = require('path');


// 2. Core Dependencies

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const multer = require("multer");
const cookieParser = require("cookie-parser");


// ---------------------------------------------------------
// 3. Local Imports
// ---------------------------------------------------------
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.route");
const restaurantRoutes = require("./routes/restaurant.route");
const orderRoutes = require("./routes/order.routes");


// ---------------------------------------------------------
// 4. Initialize App
// ---------------------------------------------------------
const app = express();



// Serve images from public/img folder
app.use('/img', express.static(path.join(__dirname, 'public/img')));

// ---------------------------------------------------------
// 5. Global Middlewares
// ---------------------------------------------------------

// Parse cookies
app.use(cookieParser());

// Set security headers
app.use(helmet());

// Parse JSON incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: "http://localhost:4200",
  credentials: true
}));

// Rate limit for all API requests
// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100,
//   message: "Too many requests. Please try again after an hour.",
// });
// app.use("/api", limiter);

// Prevent NoSQL injection + sanitize inputs
// app.use(mongoSanitize());
// app.use(xss());

// Prevent HTTP parameter pollution
app.use(hpp());


// 6. Routes

app.get("/", (req, res) => {
  res.send("Hello World!");
});


// User routes
app.use("/api/v1/user", userRoutes);

// Restaurant routes
app.use("/api/v1/restaurant", restaurantRoutes);
app.use("/api/v1/order",orderRoutes);






const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
