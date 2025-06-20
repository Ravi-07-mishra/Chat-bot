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

// Trust first proxy (for secure cookies behind proxies)
app.set("trust proxy", 1);

// Global Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);

// CORS Configuration (allow all Vercel subdomains + localhost)
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||                      // server-to-server or curl
        origin.includes("vercel.app") ||// any Vercel preview or production
        origin === "http://localhost:5173"
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
    credentials: true, // allow cookies
  })
);

// API Routes under /api/v1
app.use("/api/v1", appRouter);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Internal Server Error:", err.stack || err.message);
  if (err.message === "CORS Not Allowed") {
    return res.status(403).json({ message: "CORS not allowed" });
  }
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

module.exports = app;
