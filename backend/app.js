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

// -------- Trust Proxy (for rate-limit and secure headers behind proxies) ----------
// If you're behind a proxy (Render, Vercel), trust the first proxy hop:
app.set('trust proxy', 1);

// -------- Global Middleware ----------
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Enable gzip compression
app.use(morgan("combined")); // Detailed logs for production
app.use(express.json({ limit: "1mb" })); // Limit request body size
app.use(cookieParser(process.env.COOKIE_SECRET)); // Signed cookies

// -------- Rate Limiting (Prevent abuse) --------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                // Max requests per IP
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// -------- CORS Configuration ----------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman) or local/dev/prod domains
      if (
        !origin ||                        
        origin.includes("localhost") ||  
        /\.vercel\.app$/.test(new URL(origin).hostname)
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
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
  // If CORS error, respond accordingly
  if (err.message === "CORS Not Allowed") {
    return res.status(403).json({ message: "CORS not allowed" });
  }
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// -------- Start Server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
