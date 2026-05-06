exports.calculateFreshnessScore = ({ estimatedMinutes = 30, actualMinutes = 30, weather = "normal" }) => {
  let score = 100;
  if (actualMinutes > estimatedMinutes) score -= (actualMinutes - estimatedMinutes) * 2;
  if (weather === "rain" || weather === "hot") score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
};
