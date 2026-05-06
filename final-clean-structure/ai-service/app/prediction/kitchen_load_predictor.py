def predict_kitchen_load(active_orders: int, average_preparation_time: int = 20):
    pressure_score = active_orders * average_preparation_time
    if active_orders <= 5:
        load = "low"
    elif active_orders <= 12:
        load = "medium"
    else:
        load = "high"
    return {"load": load, "active_orders": active_orders, "pressure_score": pressure_score}
