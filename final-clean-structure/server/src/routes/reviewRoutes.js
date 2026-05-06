const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createReview, getRestaurantReviews } = require("../controllers/reviewController");

router.post("/", protect, createReview);
router.get("/restaurants/:restaurantId", getRestaurantReviews);

module.exports = router;
