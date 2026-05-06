require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socketServer");

connectDB();

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

initSocket(io);

const server = httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`Server listening on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
