from math import radians, sin, cos, sqrt, atan2

def distance_km(a, b):
    earth_radius = 6371
    dlat = radians(b["lat"] - a["lat"])
    dlng = radians(b["lng"] - a["lng"])
    x = sin(dlat / 2) ** 2 + cos(radians(a["lat"])) * cos(radians(b["lat"])) * sin(dlng / 2) ** 2
    return earth_radius * 2 * atan2(sqrt(x), sqrt(1 - x))

def optimize_multi_order_route(payload: dict):
    current = {"lat": payload.get("start_lat"), "lng": payload.get("start_lng")}
    remaining = payload.get("stops", [])
    optimized = []
    total_distance = 0

    while remaining:
        remaining.sort(key=lambda stop: distance_km(current, stop))
        next_stop = remaining.pop(0)
        step_distance = distance_km(current, next_stop)
        total_distance += step_distance
        optimized.append({**next_stop, "distance_from_previous_km": round(step_distance, 2)})
        current = next_stop

    return {"optimized_route": optimized, "total_distance_km": round(total_distance, 2)}
