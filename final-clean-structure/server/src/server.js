require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socketServer");
const { corsOptions } = require("./config/cors");

connectDB();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: true,
  },
});

initSocket(io);

const server = httpServer.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
