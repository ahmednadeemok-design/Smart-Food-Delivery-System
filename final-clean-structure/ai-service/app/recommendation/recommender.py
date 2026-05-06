from app.recommendation.narowal_sample_data import NAROWAL_SAMPLE_FOOD_ITEMS

def recommend_food(payload: dict):
    food_items = payload.get("food_items", []) or NAROWAL_SAMPLE_FOOD_ITEMS
    past_orders = [x.lower() for x in payload.get("past_orders", [])]
    user_goal = (payload.get("user_goal") or "").lower()
    time_of_day = (payload.get("time_of_day") or "").lower()
    recommendations = []

    for item in food_items:
        score = item.get("taste_score", 70)
        name = item.get("name", "").lower()
        category = item.get("category", "").lower()
        tags = [t.lower() for t in item.get("tags", [])]

        if name in past_orders or category in past_orders:
            score += 18
        if user_goal and user_goal in tags:
            score += 15
        if time_of_day == "morning" and ("breakfast" in tags or "tea" in tags):
            score += 10
        if time_of_day == "night" and ("dinner" in tags or "comfort" in tags):
            score += 10
        if item.get("calories", 0) > 900 and user_goal == "weight-loss":
            score -= 20

        recommendations.append({
            "id": item.get("id"),
            "name": item.get("name"),
            "score": max(0, min(100, round(score))),
            "reason": "Ranked by taste, history, time, and goal"
        })

    return sorted(recommendations, key=lambda x: x["score"], reverse=True)
