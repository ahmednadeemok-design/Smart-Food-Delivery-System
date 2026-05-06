const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const sentimentFromRating = (rating) => {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
};

exports.createReview = async (req, res) => {
  try {
    const { order, restaurant, foodItem, rating, comment } = req.body;
    if (!restaurant && !foodItem) return errorResponse(res, "Restaurant or food item is required", 400);
    if (!rating || rating < 1 || rating > 5) return errorResponse(res, "Rating must be between 1 and 5", 400);

    const review = await Review.create({
      order,
      restaurant,
      foodItem,
      rating,
      comment,
      user: req.user._id,
      sentiment: sentimentFromRating(Number(rating)),
    });

    if (restaurant) {
      const stats = await Review.aggregate([
        { $match: { restaurant: review.restaurant } },
        { $group: { _id: "$restaurant", average: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      if (stats[0]) {
        await Restaurant.findByIdAndUpdate(restaurant, {
          rating: Number(stats[0].average.toFixed(1)),
          totalReviews: stats[0].count,
        });
      }
    }

    if (foodItem) {
      await FoodItem.findByIdAndUpdate(foodItem, { $inc: { tasteScore: rating >= 4 ? 1 : rating <= 2 ? -2 : 0 } });
    }

    return successResponse(res, "Review submitted successfully", review, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getRestaurantReviews = async (req, res) => {
  const reviews = await Review.find({ restaurant: req.params.restaurantId })
    .populate("user", "name")
    .sort("-createdAt");
  return successResponse(res, "Reviews fetched successfully", reviews);
};
