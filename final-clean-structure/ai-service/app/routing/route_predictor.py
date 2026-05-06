def predict_route_eta(payload: dict):
    distance_km = payload.get("distance_km", 0)
    kitchen_load = payload.get("kitchen_load", "low")
    weather = payload.get("weather", "normal")
    emergency_mode = payload.get("emergency_mode", False)

    eta = (distance_km / 25) * 60
    if kitchen_load == "medium":
        eta += 8
    elif kitchen_load == "high":
        eta += 18
    if weather in ["rain", "hot", "storm"]:
        eta += 10
    if emergency_mode:
        eta *= 0.75

    return {"eta_minutes": max(5, round(eta))}
