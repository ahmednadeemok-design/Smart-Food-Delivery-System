const Rider = require("../models/Rider");
const calculateDistance = require("../utils/calculateDistance");

exports.assignBestRider = async (orderLocation) => {
  const riders = await Rider.find({ isOnline: true }).populate("user");
  if (!riders.length) return null;

  const ranked = riders
    .map((rider) => ({
      rider,
      distance: calculateDistance(rider.currentLocation, orderLocation),
      workload: rider.activeOrders.length,
      trustScore: rider.trustScore,
    }))
    .sort((a, b) => a.workload - b.workload || a.distance - b.distance || b.trustScore - a.trustScore);

  return ranked[0].rider;
};
