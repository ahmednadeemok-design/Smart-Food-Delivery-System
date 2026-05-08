const express = require("express");
const router = express.Router();
const { protect, optionalProtect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createRestaurant,
  getMyRestaurants,
  getMyRestaurantOrders,
  getMyRestaurantDashboard,
  getMyRestaurantOrderById,
  updateMyRestaurantOrderStatus,
  updateMyRestaurantOpenStatus,
  updateMyBusinessHours,
  getMyRestaurantReports,
  updateMyRestaurant,
  updateRestaurant,
  getRestaurants,
  getRestaurantById,
  addFoodItem,
  addMyFoodItem,
  getFoodItems,
  updateFoodItem,
  updateMyFoodItem,
  updateMyFoodItemAvailability,
  deleteFoodItem,
  getMyCampaigns,
  createMyCampaign,
  updateMyCampaign,
  deleteMyCampaign,
  getMySupportTickets,
  createMySupportTicket,
  updateMySupportTicket,
} = require("../controllers/restaurantController");

router.get("/", optionalProtect, getRestaurants);
router.get("/my", protect, roleMiddleware("restaurant", "admin"), getMyRestaurants);
router.get("/my/orders", protect, roleMiddleware("restaurant", "admin"), getMyRestaurantOrders);
router.get("/my/dashboard", protect, roleMiddleware("restaurant", "admin"), getMyRestaurantDashboard);
router.get("/my/reports", protect, roleMiddleware("restaurant", "admin"), getMyRestaurantReports);
router.get("/my/orders/:orderId", protect, roleMiddleware("restaurant", "admin"), getMyRestaurantOrderById);
router.patch("/my/orders/:orderId/status", protect, roleMiddleware("restaurant", "admin"), updateMyRestaurantOrderStatus);
router.patch("/my", protect, roleMiddleware("restaurant", "admin"), updateMyRestaurant);
router.post("/my", protect, roleMiddleware("restaurant", "admin"), createRestaurant);
router.patch("/my/open-status", protect, roleMiddleware("restaurant", "admin"), updateMyRestaurantOpenStatus);
router.patch("/my/business-hours", protect, roleMiddleware("restaurant", "admin"), updateMyBusinessHours);
router.post("/my/menu", protect, roleMiddleware("restaurant", "admin"), addMyFoodItem);
router.patch("/my/menu/:itemId", protect, roleMiddleware("restaurant", "admin"), updateMyFoodItem);
router.delete("/my/menu/:itemId", protect, roleMiddleware("restaurant", "admin"), deleteFoodItem);
router.patch("/my/menu/:itemId/availability", protect, roleMiddleware("restaurant", "admin"), updateMyFoodItemAvailability);
router.get("/my/campaigns", protect, roleMiddleware("restaurant", "admin"), getMyCampaigns);
router.post("/my/campaigns", protect, roleMiddleware("restaurant", "admin"), createMyCampaign);
router.patch("/my/campaigns/:id", protect, roleMiddleware("restaurant", "admin"), updateMyCampaign);
router.delete("/my/campaigns/:id", protect, roleMiddleware("restaurant", "admin"), deleteMyCampaign);
router.get("/my/support-tickets", protect, roleMiddleware("restaurant", "admin"), getMySupportTickets);
router.post("/my/support-tickets", protect, roleMiddleware("restaurant", "admin"), createMySupportTicket);
router.patch("/my/support-tickets/:id", protect, roleMiddleware("restaurant", "admin"), updateMySupportTicket);
router.get("/mine", protect, roleMiddleware("restaurant", "admin"), getMyRestaurants);
router.post("/", protect, roleMiddleware("restaurant", "admin"), createRestaurant);
router.put("/:id", protect, roleMiddleware("restaurant", "admin"), updateRestaurant);
router.get("/:id/menu", optionalProtect, getFoodItems);
router.post("/:restaurantId/items", protect, roleMiddleware("restaurant", "admin"), addFoodItem);
router.get("/:restaurantId/items", optionalProtect, getFoodItems);
router.put("/:restaurantId/items/:itemId", protect, roleMiddleware("restaurant", "admin"), updateFoodItem);
router.delete("/:restaurantId/items/:itemId", protect, roleMiddleware("restaurant", "admin"), deleteFoodItem);
router.get("/:id", optionalProtect, getRestaurantById);

module.exports = router;
