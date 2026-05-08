const Notification = require("../models/Notification");
const { successResponse } = require("../utils/apiResponse");

exports.getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("order", "status totalAmount")
    .populate("restaurant", "name")
    .sort("-createdAt")
    .limit(50);
  return successResponse(res, "Notifications fetched", notifications);
};

exports.markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  return successResponse(res, "Notification marked read", notification);
};

exports.markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: { $exists: false } }, { readAt: new Date() });
  return successResponse(res, "Notifications marked read", {});
};
