const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  recommendFood,
  freshnessScore,
  kitchenLoad,
  deliveryCost,
  deliveryTime,
  orderAccuracy,
  complaintIntent,
  refundDecision,
  goalFilter,
} = require("../controllers/aiController");

router.get("/recommendations", protect, recommendFood);
router.post("/freshness-score", freshnessScore);
router.post("/kitchen-load", kitchenLoad);
router.post("/delivery-cost", deliveryCost);
router.post("/delivery-time", deliveryTime);
router.post("/order-accuracy", orderAccuracy);
router.post("/complaint-intent", complaintIntent);
router.post("/refund-decision", refundDecision);
router.post("/goal-filter", goalFilter);

module.exports = router;
