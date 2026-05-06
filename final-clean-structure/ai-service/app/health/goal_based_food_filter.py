def filter_food_by_goal(goal: str, items: list):
    goal = goal.lower()
    filtered = []
    for item in items:
        tags = [t.lower() for t in item.get("tags", [])]
        calories = item.get("calories", 0)
        if goal == "weight-loss":
            if calories <= 600 or "healthy" in tags or "low-calorie" in tags:
                filtered.append(item)
        elif goal == "muscle-gain":
            if "protein" in tags or calories >= 500:
                filtered.append(item)
        elif goal == "budget":
            if item.get("price", 999999) <= 500:
                filtered.append(item)
        else:
            filtered.append(item)
    return {"goal": goal, "matched_items": filtered, "count": len(filtered)}
