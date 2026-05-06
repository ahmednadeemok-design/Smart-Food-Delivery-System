def calculate_calories(payload: dict):
    items = payload.get("items", [])
    total_calories = sum(item.get("calories", 0) for item in items)
    return {"total_calories": total_calories, "items_count": len(items)}
