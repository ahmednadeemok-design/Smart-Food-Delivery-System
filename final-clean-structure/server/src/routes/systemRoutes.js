const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { getSystemHealth } = require("../controllers/systemController");

router.get("/health", protect, roleMiddleware("admin"), getSystemHealth);

module.exports = router;
