const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  addFoodItem,
  getFoodItems,
} = require("../controllers/restaurantController");

router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);
router.post("/", protect, roleMiddleware("restaurant", "admin"), createRestaurant);
router.post("/:restaurantId/items", protect, roleMiddleware("restaurant", "admin"), addFoodItem);
router.get("/:restaurantId/items", getFoodItems);

module.exports = router;
