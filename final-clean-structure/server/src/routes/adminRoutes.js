const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const admin = require("../controllers/adminController");

router.use(protect, roleMiddleware("admin"));

router.get("/users", admin.listUsers);
router.patch("/users/:id", admin.updateUser);
router.delete("/users/:id", admin.deleteUser);

router.get("/restaurants", admin.listRestaurants);
router.get("/restaurants/:id/menu", admin.getRestaurantMenu);
router.patch("/restaurants/:id", admin.updateRestaurant);
router.delete("/restaurants/:id", admin.deleteRestaurant);

router.get("/riders", admin.listRiders);
router.patch("/riders/:id", admin.updateRider);

router.get("/orders", admin.listOrders);
router.patch("/orders/:id", admin.updateOrder);

router.get("/complaints", admin.listComplaints);
router.patch("/complaints/:id", admin.updateComplaint);

router.get("/payments", admin.listPayments);
router.patch("/payments/:id/refund", admin.refundPayment);

router.post("/trust-scores", admin.adjustTrustScore);
router.get("/trust-scores", admin.getTrustHistory);
router.get("/audit-logs", admin.getAuditLogs);

module.exports = router;
