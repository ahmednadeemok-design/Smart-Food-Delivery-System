const calculateDeliveryCost = require("../utils/calculateDeliveryCost");

exports.getDeliveryCostBreakdown = ({ distanceKm, demandFactor = 1, weatherFactor = 1 }) => {
  return calculateDeliveryCost({ distanceKm, demandFactor, weatherFactor });
};
