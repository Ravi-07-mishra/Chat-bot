const { COOKIE_NAME } = require('./constants');
const jwt = require('jsonwebtoken');

const createToken = (id, email, expiresIn) => {
  const payload = { id, email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
  return token;
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.signedCookies[COOKIE_NAME] || req.headers.authorization?.split(" ")[1];


    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "Token not received" });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ message: "Token expired or invalid" });
      }

      console.log("Token verification successful");
      res.locals.jwtData = decoded; // Save decoded token to res.locals
      next(); // Proceed to the next middleware
    });
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createToken, verifyToken };
