const Notification = require("../models/Notification");

const createNotification = async (payload) => {
  if (!payload?.user || !payload?.title || !payload?.message) return null;
  try {
    return await Notification.create(payload);
  } catch (error) {
    console.warn(`Notification skipped: ${error.message}`);
    return null;
  }
};

const notifyOrderParticipants = async (order, title, message) => {
  const notifications = [];
  const customerId = order.customer?._id || order.customer;
  const ownerId = order.restaurant?.owner || order.restaurantOwner;
  const riderUserId = order.rider?.user?._id || order.riderUser;

  if (customerId) notifications.push(createNotification({ user: customerId, type: "order", title, message, order: order._id, restaurant: order.restaurant?._id || order.restaurant }));
  if (ownerId) notifications.push(createNotification({ user: ownerId, type: "order", title, message, order: order._id, restaurant: order.restaurant?._id || order.restaurant }));
  if (riderUserId) notifications.push(createNotification({ user: riderUserId, type: "order", title, message, order: order._id, rider: order.rider?._id || order.rider }));

  await Promise.all(notifications);
};

module.exports = { createNotification, notifyOrderParticipants };
