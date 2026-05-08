const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createRestaurant,
  getMyRestaurants,
  getMyRestaurantOrders,
  updateMyRestaurant,
  updateRestaurant,
  getRestaurants,
  getRestaurantById,
  addFoodItem,
  getFoodItems,
  updateFoodItem,
  deleteFoodItem,
} = require("../controllers/restaurantController");

router.get("/", getRestaurants);
router.get("/my", protect, roleMiddleware("restaurant", "admin"), getMyRestaurants);
router.get("/my/orders", protect, roleMiddleware("restaurant", "admin"), getMyRestaurantOrders);
router.patch("/my", protect, roleMiddleware("restaurant", "admin"), updateMyRestaurant);
router.get("/mine", protect, roleMiddleware("restaurant", "admin"), getMyRestaurants);
router.post("/", protect, roleMiddleware("restaurant", "admin"), createRestaurant);
router.put("/:id", protect, roleMiddleware("restaurant", "admin"), updateRestaurant);
router.post("/:restaurantId/items", protect, roleMiddleware("restaurant", "admin"), addFoodItem);
router.get("/:restaurantId/items", getFoodItems);
router.put("/:restaurantId/items/:itemId", protect, roleMiddleware("restaurant", "admin"), updateFoodItem);
router.delete("/:restaurantId/items/:itemId", protect, roleMiddleware("restaurant", "admin"), deleteFoodItem);
router.get("/:id", getRestaurantById);

module.exports = router;
