const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createComplaint, getComplaints, updateComplaintStatus } = require("../controllers/complaintController");

router.post("/", protect, createComplaint);
router.get("/", protect, roleMiddleware("admin"), getComplaints);
router.patch("/:id", protect, roleMiddleware("admin"), updateComplaintStatus);

module.exports = router;
