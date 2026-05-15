const { sanitizeOrderForRole } = require("./contactPrivacyService");

const roomId = (value) => String(value?._id || value || "");

const orderPayload = (order, extra = {}, role = "customer") => ({
  orderId: roomId(order),
  status: order?.status,
  order: sanitizeOrderForRole(order, role),
  ...extra,
});

const getRestaurantId = (order) => roomId(order?.restaurant);
const getCustomerId = (order) => roomId(order?.customer);
const getRiderId = (order) => roomId(order?.rider);

const emitToOrderParticipants = (io, event, order, extra = {}) => {
  if (!io || !order?._id) return;
  io.to(`order:${roomId(order)}`).emit(event, orderPayload(order, extra, "customer"));
  if (getCustomerId(order)) io.to(`customer:${getCustomerId(order)}`).emit(event, orderPayload(order, extra, "customer"));
  if (getRestaurantId(order)) io.to(`restaurant:${getRestaurantId(order)}`).emit(event, orderPayload(order, extra, "restaurant"));
  if (getRiderId(order)) io.to(`rider:${getRiderId(order)}`).emit(event, orderPayload(order, extra, "rider"));
  io.to("admin").emit(event, orderPayload(order, extra, "admin"));
  io.to("admin").emit("admin:order-lifecycle", orderPayload(order, extra, "admin"));
};

const emitOrderRealtime = (req, event, order, extra = {}) => {
  const io = req?.app?.get("io");
  emitToOrderParticipants(io, event, order, extra);
  if (io && ["rider:new-ready-order", "rider:ready-order-removed"].includes(event)) {
    io.to("riders:available").emit(event, orderPayload(order, extra, "rider"));
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
