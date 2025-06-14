const jwt = require("jsonwebtoken");

// Create JWT
const createToken = (id, email, expiresIn) => {
  const payload = { id, email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Middleware to verify JWT from cookie
const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "Token not found in cookie" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ message: "Token expired or invalid" });
      }

      res.locals.jwtData = decoded;
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createToken, verifyToken };
