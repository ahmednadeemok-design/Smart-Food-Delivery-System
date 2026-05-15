const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorMiddleware");
const { corsOptions } = require("./config/cors");
const { rateLimit, securityHeaders } = require("./middlewares/securityMiddleware");

const app = express();

app.disable("x-powered-by");
app.use(securityHeaders);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: "auth" }));
app.use("/api/admin/finance", rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "admin-finance" }));
app.use("/api/payments", rateLimit({ windowMs: 60 * 1000, max: 90, keyPrefix: "payments" }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Food Delivery API is running...",
  });
});

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  res.status(200).json({
    success: true,
    message: "OK",
    uptime: process.uptime(),
    data: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  });
});

app.use("/api", (req, res, next) => {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 1) return next();
  const allowOfflineRead =
    req.method === "GET" &&
    (
      req.path === "/restaurants" ||
      /^\/restaurants\/[^/]+$/.test(req.path) ||
      /^\/restaurants\/[^/]+\/(items|menu)$/.test(req.path) ||
      req.path.startsWith("/system")
    );
  const allowOfflineAI = req.path.startsWith("/ai");
  if (allowOfflineRead || allowOfflineAI) return next();

  return res.status(503).json({
    success: false,
    message: "Database unavailable. Start MongoDB and retry.",
    data: {},
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/restaurants", require("./routes/restaurantRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/riders", require("./routes/riderRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/system", require("./routes/systemRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use(errorHandler);

module.exports = app;
