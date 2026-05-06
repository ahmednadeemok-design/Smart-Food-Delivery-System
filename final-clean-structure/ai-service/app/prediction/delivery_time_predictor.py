def predict_delivery_time(payload: dict):
    eta = 10 + payload.get("distance_km", 0) * 4
    kitchen_load = payload.get("kitchen_load", "low")
    weather = payload.get("weather", "normal")
    if kitchen_load == "medium":
        eta += 8
    elif kitchen_load == "high":
        eta += 18
    if weather in ["rain", "storm"]:
        eta += 12
    elif weather == "hot":
        eta += 6
    if payload.get("emergency_mode", False):
        eta *= 0.75
    return {"estimated_delivery_minutes": round(max(8, eta))}
