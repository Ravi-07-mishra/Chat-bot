const jwt = require("jsonwebtoken");

const createToken = (id, email, expiresIn) => {
  const payload = { id, email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.bot_token;
    
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
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createToken, verifyToken };