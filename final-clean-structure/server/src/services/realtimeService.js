const roomId = (value) => String(value?._id || value || "");

const orderPayload = (order, extra = {}) => ({
  orderId: roomId(order),
  status: order?.status,
  order,
  ...extra,
});

const getRestaurantId = (order) => roomId(order?.restaurant);
const getCustomerId = (order) => roomId(order?.customer);
const getRiderId = (order) => roomId(order?.rider);

const emitToOrderParticipants = (io, event, order, extra = {}) => {
  if (!io || !order?._id) return;
  const payload = orderPayload(order, extra);
  const rooms = [
    `order:${roomId(order)}`,
    getCustomerId(order) && `customer:${getCustomerId(order)}`,
    getRestaurantId(order) && `restaurant:${getRestaurantId(order)}`,
    getRiderId(order) && `rider:${getRiderId(order)}`,
    "admin",
  ].filter(Boolean);

  rooms.forEach((room) => io.to(room).emit(event, payload));
  io.to("admin").emit("admin:order-lifecycle", payload);
};

const emitOrderRealtime = (req, event, order, extra = {}) => {
  const io = req?.app?.get("io");
  emitToOrderParticipants(io, event, order, extra);
  if (io && ["rider:new-ready-order", "rider:ready-order-removed"].includes(event)) {
    io.to("riders:available").emit(event, orderPayload(order, extra));
  }
};

const emitRestaurantRealtime = (req, event, restaurant, extra = {}) => {
  const io = req?.app?.get("io");
  if (!io || !restaurant?._id) return;
  const payload = { restaurantId: roomId(restaurant), restaurant, ...extra };
  io.to(`restaurant:${roomId(restaurant)}`).emit(event, payload);
  io.to("admin").emit(event, payload);
  io.to("admin").emit("admin:restaurant-updated", payload);
};

const emitRiderRealtime = (req, event, rider, extra = {}) => {
  const io = req?.app?.get("io");
  if (!io || !rider?._id) return;
  const payload = { riderId: roomId(rider), rider, ...extra };
  io.to(`rider:${roomId(rider)}`).emit(event, payload);
  io.to("admin").emit(event, payload);
  io.to("admin").emit("admin:rider-updated", payload);
};

const emitAdminRealtime = (req, event, payload = {}) => {
  const io = req?.app?.get("io");
  if (!io) return;
  io.to("admin").emit(event, payload);
};

module.exports = {
  emitAdminRealtime,
  emitOrderRealtime,
  emitRestaurantRealtime,
  emitRiderRealtime,
  emitToOrderParticipants,
};
