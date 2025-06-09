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
    // allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

app.use("/api/v1", appRouter);

module.exports = app;
