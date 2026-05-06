const express = require("express");
const router = express.Router();
const { getUsers, updateProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/", protect, roleMiddleware("admin"), getUsers);
router.put("/profile", protect, updateProfile);

module.exports = router;
