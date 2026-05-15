const { friendlyValidationMessage } = require("../utils/validationMessages");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError") {
    error.message = "Resource not found";
    error.statusCode = 404;
  }

  if (err.code === 11000) {
    error.message = "Email already exists.";
    error.statusCode = 400;
  }

  if (err.name === "ValidationError") {
    error.message = friendlyValidationMessage(err);
    error.statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = 401;
  }

  if (err.message?.includes("buffering timed out") || err.message?.includes("ECONNREFUSED")) {
    error.message = "Database unavailable. Start MongoDB and retry.";
    error.statusCode = 503;
  }

  const statusCode = error.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  console.error(`[error] ${req.method} ${req.originalUrl} ${statusCode}: ${error.message}`);

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server Error",
    data: {},
  });
};

module.exports = errorHandler;
