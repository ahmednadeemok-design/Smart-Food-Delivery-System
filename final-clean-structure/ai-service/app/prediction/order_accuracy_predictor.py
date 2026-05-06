def predict_order_accuracy(total_orders: int, wrong_item_complaints: int, missing_item_complaints: int):
    if total_orders <= 0:
        return {"accuracy_rate": 100, "risk": "unknown"}
    complaint_rate = (wrong_item_complaints + missing_item_complaints) / total_orders
    accuracy = max(40, round(100 - complaint_rate * 100))
    risk = "low" if accuracy >= 90 else "medium" if accuracy >= 75 else "high"
    return {"accuracy_rate": accuracy, "risk": risk}
