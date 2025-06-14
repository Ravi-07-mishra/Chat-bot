// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const appRouter = require("./routes");

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET || !process.env.MONGO_URI) {
  console.error("❌ Required environment variables are missing.");
  process.exit(1);
}

const app = express();

// -------- Global Middleware ----------
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Enable gzip compression
app.use(morgan("combined")); // Detailed logs for production
app.use(express.json({ limit: "1mb" })); // Limit request body size
app.use(cookieParser(process.env.COOKIE_SECRET)); // Signed cookies

// -------- Rate Limiting (Prevent abuse) --------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per IP
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// -------- CORS Configuration ----------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// -------- Application Routes ----------
app.use("/api/v1", appRouter);

// -------- 404 Fallback ----------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// -------- Error Handler Middleware ----------
app.use((err, req, res, next) => {
  console.error("🔥 Internal Server Error:", err.stack || err.message);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

module.exports = app;
