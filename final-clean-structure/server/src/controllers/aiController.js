const FoodItem = require("../models/FoodItem");
const { successResponse } = require("../utils/apiResponse");
const { getRecommendations } = require("../services/recommendationService");
const { calculateFreshnessScore } = require("../services/freshnessScoreService");
const { calculateKitchenLoad } = require("../services/kitchenLoadService");
const { getDeliveryCostBreakdown } = require("../services/deliveryCostService");

exports.recommendFood = async (req, res) => {
  const foodItems = await FoodItem.find();
  const recommendations = await getRecommendations({ user: req.user, foodItems });
  return successResponse(res, "AI recommendations fetched", recommendations);
};

exports.freshnessScore = async (req, res) => {
  const score = calculateFreshnessScore(req.body);
  return successResponse(res, "Freshness score calculated", { score });
};

exports.kitchenLoad = async (req, res) => {
  const load = calculateKitchenLoad(req.body.activeOrders);
  return successResponse(res, "Kitchen load calculated", { load });
};

exports.deliveryCost = async (req, res) => {
  const cost = getDeliveryCostBreakdown(req.body);
  return successResponse(res, "Delivery cost calculated", cost);
};
