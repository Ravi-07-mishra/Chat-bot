const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const appRouter = require('./routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

app.use("/api/v1", appRouter);

module.exports = app;