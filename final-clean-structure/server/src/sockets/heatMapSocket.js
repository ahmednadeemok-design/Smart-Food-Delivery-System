module.exports = (io, socket) => {
  socket.on("heatmap-update", (payload) => {
    if (!socket.user?._id || socket.user.role !== "admin") return;
    io.emit("heatmap-updated", payload);
  });
};
