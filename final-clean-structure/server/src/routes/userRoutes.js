const express = require("express");
const router = express.Router();
const { getUsers, updateProfile, addSavedAddress, deleteSavedAddress } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/", protect, roleMiddleware("admin"), getUsers);
router.put("/profile", protect, updateProfile);
router.post("/addresses", protect, roleMiddleware("customer"), addSavedAddress);
router.delete("/addresses/:id", protect, roleMiddleware("customer"), deleteSavedAddress);

module.exports = router;
