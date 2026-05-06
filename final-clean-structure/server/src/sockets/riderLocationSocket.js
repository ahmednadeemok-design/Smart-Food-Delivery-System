module.exports = (io, socket) => {
  socket.on("rider-location-update", ({ riderId, location }) => {
    io.emit("rider-location-updated", { riderId, location });
  });
};
