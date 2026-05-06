const calculateDistance = require("../utils/calculateDistance");

exports.optimizeMultiOrderRoute = (startLocation, stops = []) => {
  const route = [];
  let current = startLocation;
  const remaining = [...stops];

  while (remaining.length) {
    remaining.sort((a, b) => calculateDistance(current, a.location) - calculateDistance(current, b.location));
    const next = remaining.shift();
    route.push(next);
    current = next.location;
  }

  return route;
};
