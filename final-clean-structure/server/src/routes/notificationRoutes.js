const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getMyNotifications, markAllNotificationsRead, markNotificationRead } = require("../controllers/notificationController");

router.use(protect);
router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
