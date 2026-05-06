const orderTrackingSocket = require("./orderTrackingSocket");
const riderLocationSocket = require("./riderLocationSocket");
const heatMapSocket = require("./heatMapSocket");

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    orderTrackingSocket(io, socket);
    riderLocationSocket(io, socket);
    heatMapSocket(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
