const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const admin = require("../controllers/adminController");

router.use(protect, roleMiddleware("admin"));

router.get("/users", admin.listUsers);
router.patch("/users/:id", admin.updateUser);
router.post("/users/:id/password-reset", admin.issuePasswordReset);
router.delete("/users/:id", admin.deleteUser);

router.get("/restaurants", admin.listRestaurants);
router.get("/restaurant-support-tickets", admin.listRestaurantSupportTickets);
router.patch("/restaurant-support-tickets/:id", admin.updateRestaurantSupportTicket);
router.get("/restaurants/:id/menu", admin.getRestaurantMenu);
router.get("/restaurants/:id", admin.getRestaurant);
router.patch("/restaurants/:id/approve", admin.approveRestaurant);
router.patch("/restaurants/:id/reject", admin.rejectRestaurant);
router.patch("/restaurants/:id/suspend", admin.suspendRestaurant);
router.patch("/restaurants/:id/reactivate", admin.reactivateRestaurant);
router.patch("/restaurants/:id/reset-owner-password", admin.resetRestaurantOwnerPassword);
router.patch("/restaurants/:id", admin.updateRestaurant);
router.delete("/restaurants/:id", admin.deleteRestaurant);

router.get("/riders", admin.listRiders);
router.get("/riders/:id", admin.getRider);
router.patch("/riders/:id", admin.updateRider);
router.patch("/riders/:id/status", admin.updateRider);
router.patch("/riders/:id/approve", admin.approveRider);
router.patch("/riders/:id/suspend", admin.suspendRider);

router.get("/orders", admin.listOrders);
router.patch("/orders/:id", admin.updateOrder);
router.patch("/orders/:id/trash", admin.softDeleteOrder);
router.patch("/orders/:id/restore", admin.restoreOrder);
router.delete("/orders/:id/permanent", admin.permanentlyDeleteOrder);

router.get("/complaints", admin.listComplaints);
router.patch("/complaints/:id", admin.updateComplaint);

router.get("/payments", admin.listPayments);
router.patch("/payments/:id/refund", admin.refundPayment);
router.get("/finance/summary", admin.financialSummary);

router.post("/trust-scores", admin.adjustTrustScore);
router.get("/trust-scores", admin.getTrustHistory);
router.get("/audit-logs", admin.getAuditLogs);

module.exports = router;
