export function getTasteRisk(tasteScore = 100) {
  if (tasteScore >= 85) return "Excellent";
  if (tasteScore >= 70) return "Acceptable";
  if (tasteScore >= 55) return "Warning";
  return "High Risk";
}
