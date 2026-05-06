const FoodItem = require("../models/FoodItem");
const { successResponse } = require("../utils/apiResponse");
const { getRecommendations } = require("../services/recommendationService");
const { calculateFreshnessScore } = require("../services/freshnessScoreService");
const { calculateKitchenLoad } = require("../services/kitchenLoadService");
const { getDeliveryCostBreakdown } = require("../services/deliveryCostService");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const callAIService = async (path, payload) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`AI service responded with ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

exports.recommendFood = async (req, res) => {
  const foodItems = await FoodItem.find();

  try {
    const aiResponse = await callAIService("/recommendations", {
      user_goal: req.user.healthProfile?.dietType || "",
      past_orders: [],
      food_items: foodItems.map((item) => ({
        id: String(item._id),
        name: item.name,
        category: item.category || "",
        tags: item.tags || [],
        calories: item.calories || 0,
        taste_score: item.tasteScore || 100,
        price: item.price || 0,
      })),
    });

    return successResponse(res, "AI recommendations fetched from AI service", aiResponse.data);
  } catch {
    const recommendations = await getRecommendations({ user: req.user, foodItems });
    return successResponse(res, "AI recommendations fetched", recommendations);
  }
};

exports.freshnessScore = async (req, res) => {
  try {
    const aiResponse = await callAIService("/prediction/freshness-score", {
      estimated_minutes: req.body.estimatedMinutes,
      actual_minutes: req.body.actualMinutes,
      weather: req.body.weather || "normal",
    });

    return successResponse(res, "Freshness score calculated by AI service", {
      score: aiResponse.data?.freshness_score ?? aiResponse.data,
      details: aiResponse.data,
    });
  } catch {
    const score = calculateFreshnessScore(req.body);
    return successResponse(res, "Freshness score calculated", { score });
  }
};

exports.kitchenLoad = async (req, res) => {
  try {
    const aiResponse = await callAIService("/prediction/kitchen-load", {
      active_orders: req.body.activeOrders,
      average_preparation_time: req.body.averagePreparationTime || 20,
    });

    return successResponse(res, "Kitchen load calculated by AI service", {
      load: aiResponse.data?.load ?? aiResponse.data,
      details: aiResponse.data,
    });
  } catch {
    const load = calculateKitchenLoad(req.body.activeOrders);
    return successResponse(res, "Kitchen load calculated", { load });
  }
};

exports.deliveryCost = async (req, res) => {
  const cost = getDeliveryCostBreakdown(req.body);
  return successResponse(res, "Delivery cost calculated", cost);
};

exports.deliveryTime = async (req, res) => {
  try {
    const aiResponse = await callAIService("/prediction/delivery-time", {
      distance_km: req.body.distanceKm || 3,
      kitchen_load: req.body.kitchenLoad || "low",
      weather: req.body.weather || "normal",
      emergency_mode: Boolean(req.body.emergencyMode),
    });
    return successResponse(res, "Delivery time predicted by AI service", aiResponse.data);
  } catch {
    const base = Number(req.body.distanceKm || 3) * 5 + 12;
    const loadDelay = req.body.kitchenLoad === "high" ? 15 : req.body.kitchenLoad === "medium" ? 8 : 0;
    return successResponse(res, "Delivery time predicted", { estimated_minutes: Math.max(12, Math.round(base + loadDelay)) });
  }
};

exports.orderAccuracy = async (req, res) => {
  try {
    const aiResponse = await callAIService("/prediction/order-accuracy", {
      total_orders: req.body.totalOrders || 0,
      wrong_item_complaints: req.body.wrongItemComplaints || 0,
      missing_item_complaints: req.body.missingItemComplaints || 0,
    });
    return successResponse(res, "Order accuracy predicted by AI service", aiResponse.data);
  } catch {
    const total = Math.max(1, Number(req.body.totalOrders || 1));
    const issues = Number(req.body.wrongItemComplaints || 0) + Number(req.body.missingItemComplaints || 0);
    return successResponse(res, "Order accuracy predicted", { accuracy_rate: Math.max(0, Math.round(100 - (issues / total) * 100)) });
  }
};

exports.complaintIntent = async (req, res) => {
  try {
    const aiResponse = await callAIService("/complaints/intent", {
      message: req.body.message || "",
      order_status: req.body.orderStatus || "",
      freshness_score: req.body.freshnessScore || 100,
      order_total: req.body.orderTotal || 0,
    });
    return successResponse(res, "Complaint intent detected by AI service", aiResponse.data);
  } catch {
    const message = String(req.body.message || "").toLowerCase();
    const intent = message.includes("late") ? "late_delivery" : message.includes("missing") ? "missing_item" : message.includes("cold") || message.includes("quality") ? "bad_quality" : "other";
    return successResponse(res, "Complaint intent detected", { intent, reply: "Complaint received for Narowal support review." });
  }
};

exports.refundDecision = async (req, res) => {
  try {
    const aiResponse = await callAIService("/complaints/refund", {
      message: req.body.message || "",
      order_status: req.body.orderStatus || "",
      freshness_score: req.body.freshnessScore || 100,
      order_total: req.body.orderTotal || 0,
    });
    return successResponse(res, "Refund decision calculated by AI service", aiResponse.data);
  } catch {
    const orderTotal = Number(req.body.orderTotal || 0);
    const freshnessScore = Number(req.body.freshnessScore || 100);
    const compensation = freshnessScore < 70 ? Math.round(orderTotal * 0.25) : 0;
    return successResponse(res, "Refund decision calculated", { decision: compensation ? "partial_refund" : "no_refund", compensation });
  }
};

exports.goalFilter = async (req, res) => {
  const foodItems = await FoodItem.find();
  const mappedItems = foodItems.map((item) => ({
    id: String(item._id),
    name: item.name,
    category: item.category || "",
    tags: item.tags || [],
    calories: item.calories || 0,
    taste_score: item.tasteScore || 100,
    price: item.price || 0,
  }));

  try {
    const aiResponse = await callAIService("/health/goal-filter", {
      goal: req.body.goal || "balanced",
      items: mappedItems,
    });
    return successResponse(res, "Goal-based food filtered by AI service", aiResponse.data);
  } catch {
    const goal = String(req.body.goal || "").toLowerCase();
    const filtered = mappedItems.filter((item) => goal.includes("low") ? item.calories <= 650 : goal.includes("protein") ? item.tags.includes("bbq") || item.tags.includes("grill") || item.tags.includes("chicken") : true);
    return successResponse(res, "Goal-based food filtered", filtered.slice(0, 10));
  }
};
