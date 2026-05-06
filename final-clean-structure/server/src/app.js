const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorMiddleware");

const app = express();

// ✅ Proper CORS fix
const allowedOrigins = [
  "http://localhost:5173", // client
  "http://localhost:5174", // rider
  "http://localhost:5175", // restaurant
  "http://localhost:5176", // admin
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Food Delivery API is running...",
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/restaurants", require("./routes/restaurantRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/riders", require("./routes/riderRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error middleware
app.use(errorHandler);

module.exports = app;