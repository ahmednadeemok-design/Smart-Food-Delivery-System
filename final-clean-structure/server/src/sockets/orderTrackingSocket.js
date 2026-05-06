module.exports = (io, socket) => {
  socket.on("join-order", (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on("order-status-update", ({ orderId, status }) => {
    io.to(`order:${orderId}`).emit("order-status-updated", { orderId, status });
  });
};
