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

// Validate essential environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'COOKIE_SECRET', 
  'MONGO_URI',
  'NODE_ENV'
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
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.VITE_API_URL || 'http://localhost:5173']
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Trust first proxy
app.set("trust proxy", 1);

// Enhanced CORS Configuration - MOVED BEFORE OTHER MIDDLEWARE
const allowedOrigins = [
  /\.vercel\.app$/,
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? origin === allowed 
        : allowed.test(origin)
    );
    
    isAllowed 
      ? callback(null, true) 
      : callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  exposedHeaders: ['set-cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Other middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  console.log("📥 Incoming cookies:", req.hostname, req.path, req.cookies);
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

// API Routes
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

// Error Handler
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