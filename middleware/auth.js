const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // contains user id + email
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
