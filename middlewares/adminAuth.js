import jwt from "jsonwebtoken";

function adminAuth(req, res, next) {
  const authHeader = req.header("Authorization") || req.header("x-auth-token");
  console.log("Admin Auth Middleware - Authorization Header:", authHeader); // Debug

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided" });
  }

  let token;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = authHeader;
  }
  console.log("Admin Auth Middleware - Extracted Token:", token); // Debug

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  console.log("Admin Auth Middleware - JWT_SECRET:", jwtSecret ? "Defined" : "Undefined"); // Debug

  if (!jwtSecret) {
    console.error("JWT_SECRET is not defined");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log("Admin Auth Middleware - Decoded Token:", decoded); // Debug
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export default adminAuth;