module.exports = (io, socket) => {
  socket.on("heatmap-update", (payload) => {
    io.emit("heatmap-updated", payload);
  });
};
