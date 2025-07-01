const jwt = require("jsonwebtoken");

const createToken = (id, email, expiresIn) => {
  const payload = { id, email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (req, res, next) => {
  let token = req.cookies.bot_token;
  
  // Check Authorization header if cookie not found
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.clearCookie("bot_token");
      return res.status(401).json({ message: "Token expired or invalid" });
    }
    res.locals.jwtData = decoded;
    next();
  });
};

module.exports = { createToken, verifyToken };