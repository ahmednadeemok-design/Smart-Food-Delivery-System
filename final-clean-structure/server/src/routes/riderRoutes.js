const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createRiderProfile, updateLocation, getRiders } = require("../controllers/riderController");

router.post("/profile", protect, roleMiddleware("rider"), createRiderProfile);
router.patch("/location", protect, roleMiddleware("rider"), updateLocation);
router.get("/", protect, roleMiddleware("admin"), getRiders);

module.exports = router;
