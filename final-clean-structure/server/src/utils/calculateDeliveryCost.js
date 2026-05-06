const calculateDeliveryCost = ({ distanceKm = 0, demandFactor = 1, weatherFactor = 1 }) => {
  const baseFare = 80;
  const perKm = 35;
  const cost = (baseFare + distanceKm * perKm) * demandFactor * weatherFactor;

  return {
    baseFare,
    distanceCost: Number((distanceKm * perKm).toFixed(2)),
    demandFactor,
    weatherFactor,
    total: Math.round(cost),
  };
};

module.exports = calculateDeliveryCost;
