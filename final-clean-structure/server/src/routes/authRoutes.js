const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getProfile);
router.get("/admin-only", protect, roleMiddleware("admin"), (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin" });
});

module.exports = router;
