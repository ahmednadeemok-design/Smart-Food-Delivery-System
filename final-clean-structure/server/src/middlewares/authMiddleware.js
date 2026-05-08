const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { dbUnavailableResponse, isDbReady } = require("../utils/authUtils");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is missing in server environment" });
    }

    if (!isDbReady()) return dbUnavailableResponse(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return next();
    if (!process.env.JWT_SECRET || !isDbReady()) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    return next();
  } catch {
    return next();
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not allowed to access this route`,
      });
    }
    next();
  };
};
