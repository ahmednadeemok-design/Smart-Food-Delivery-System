module.exports = (io, socket) => {
  socket.on("join-order", (orderId) => {
    if (!socket.user?._id || !orderId) return;
    socket.join(`order:${orderId}`);
  });

  socket.on("order-status-update", ({ orderId, status }) => {
    if (socket.user?.role !== "admin") return;
    io.to(`order:${orderId}`).emit("order-status-updated", { orderId, status });
  });
};
