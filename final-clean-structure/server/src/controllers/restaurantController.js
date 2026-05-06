const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.create({ ...req.body, owner: req.user._id });
    return successResponse(res, "Restaurant created successfully", restaurant, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find().sort("-createdAt");
  return successResponse(res, "Restaurants fetched successfully", restaurants);
};

exports.getRestaurantById = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  return successResponse(res, "Restaurant fetched successfully", restaurant);
};

exports.addFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.create({ ...req.body, restaurant: req.params.restaurantId });
    return successResponse(res, "Food item added successfully", item, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getFoodItems = async (req, res) => {
  const items = await FoodItem.find({ restaurant: req.params.restaurantId });
  return successResponse(res, "Food items fetched successfully", items);
};
