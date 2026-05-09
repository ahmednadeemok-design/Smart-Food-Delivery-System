const orderTrackingSocket = require("./orderTrackingSocket");
const riderLocationSocket = require("./riderLocationSocket");
const heatMapSocket = require("./heatMapSocket");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Rider = require("../models/Rider");
const Restaurant = require("../models/Restaurant");

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return next();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name");
      if (!user) return next(new Error("Socket authentication failed"));

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-role-rooms", async () => {
      if (!socket.user?._id) return;
      socket.join(`customer:${socket.user._id}`);
      if (socket.user.role === "admin") socket.join("admin");
      if (socket.user.role === "restaurant") {
        const restaurants = await Restaurant.find({ owner: socket.user._id }).select("_id");
        restaurants.forEach((restaurant) => socket.join(`restaurant:${restaurant._id}`));
      }
      if (socket.user.role === "rider") {
        const rider = await Rider.findOne({ user: socket.user._id }).select("_id");
        if (rider) socket.join(`rider:${rider._id}`);
        socket.join("riders:available");
      }
      socket.emit("realtime:ready", { role: socket.user.role, userId: socket.user._id });
    });

    orderTrackingSocket(io, socket);
    riderLocationSocket(io, socket);
    heatMapSocket(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
