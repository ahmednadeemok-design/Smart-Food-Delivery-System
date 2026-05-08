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
app.set("io", io);

const server = httpServer.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT.`);
    process.exit(1);
  }
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
