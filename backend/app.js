const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const appRouter = require('./routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-bot-v7zp.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);

    // Allow localhost during dev
    if (origin === "http://localhost:5173") return callback(null, true);

    // Allow all Vercel deployments
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    // Otherwise, block
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

app.use("/api/v1", appRouter);

module.exports = app;
