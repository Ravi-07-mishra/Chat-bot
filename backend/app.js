const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const appRouter = require("./routes");

// Load environment variables - should be first
dotenv.config();

// Validate essential environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'COOKIE_SECRET', 
  'MONGO_URI',
  'NODE_ENV' // Added this as required
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars.join(', '));
  process.exit(1);
}

const app = express();

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"], // Adjust as needed
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.VITE_API_URL || 'http://localhost:5173']
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" } // Needed for Vercel
}));

// Trust first proxy (for secure cookies behind proxies)
app.set("trust proxy", 1);

// Other middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Rate Limiting - more production-appropriate settings
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Different limits
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

// Enhanced CORS Configuration
const allowedOrigins = [
  /\.vercel\.app$/, // All Vercel deployments
  process.env.FRONTEND_URL, // Your production frontend
  'http://localhost:5173' // Local development
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server
    
    if (
      allowedOrigins.some(allowed => 
        typeof allowed === 'string' 
          ? origin === allowed 
          : allowed.test(origin)
      )
    ) {
      return callback(null, true);
    }
    
    console.warn('CORS Blocked for origin:', origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// API Routes under /api/v1
app.use("/api/v1", appRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.path,
    method: req.method 
  });
});

// Enhanced Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ 
      message: "CORS not allowed",
      allowedOrigins: allowedOrigins.map(o => o.toString())
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

module.exports = app;