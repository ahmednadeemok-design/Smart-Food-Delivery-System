exports.getRecommendations = async ({ user, foodItems }) => {
  const dietType = user?.healthProfile?.dietType;
  const hour = new Date().getHours();

  return foodItems
    .filter((item) => {
      if (!dietType) return true;
      return item.tags?.includes(dietType) || true;
    })
    .map((item) => {
      let score = item.tasteScore || 50;
      if (hour >= 18 && item.tags?.includes("dinner")) score += 10;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};
