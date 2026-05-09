module.exports = (io, socket) => {
  socket.on("rider-location-update", ({ riderId, location }) => {
    if (!socket.user?._id || socket.user.role !== "rider") return;
    io.emit("rider-location-updated", { riderId, location });
  });
};
