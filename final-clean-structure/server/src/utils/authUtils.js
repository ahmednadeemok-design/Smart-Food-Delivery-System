const mongoose = require("mongoose");

const isDbReady = () => mongoose.connection.readyState === 1;

const dbUnavailableResponse = (res) =>
  res.status(503).json({
    success: false,
    message: "Database unavailable. Start MongoDB and retry authentication.",
    data: {},
  });

const normalizeAuthPhone = (phone = "") => {
  const compact = String(phone).replace(/\s|-/g, "");
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  if (/^923\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
};

const logAuthError = (context, error) => {
  console.error(`[auth:${context}] ${error.name || "Error"} ${error.code || ""} - ${error.message}`);
};

module.exports = {
  dbUnavailableResponse,
  isDbReady,
  logAuthError,
  normalizeAuthPhone,
};
