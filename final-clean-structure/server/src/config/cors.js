const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
];

const parseOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const configuredOrigins = [...parseOrigins(process.env.CLIENT_URL), ...parseOrigins(process.env.CORS_ORIGINS)];
const allowedOrigins = [
  ...new Set([...(process.env.NODE_ENV === "production" ? [] : defaultOrigins), ...configuredOrigins]),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
      return callback(new Error("CORS_ORIGINS or CLIENT_URL must be configured in production"));
    }
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = { allowedOrigins, corsOptions, isAllowedOrigin };
