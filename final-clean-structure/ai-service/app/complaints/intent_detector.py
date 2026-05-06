def detect_intent(message: str):
    msg = message.lower()
    if any(w in msg for w in ["late", "delay", "time", "rider not coming"]):
        return "late_delivery"
    if any(w in msg for w in ["missing", "not included", "item missing"]):
        return "missing_item"
    if any(w in msg for w in ["wrong", "different", "not what i ordered"]):
        return "wrong_item"
    if any(w in msg for w in ["bad", "cold", "stale", "quality", "taste"]):
        return "bad_quality"
    if any(w in msg for w in ["payment", "charged", "refund", "money"]):
        return "payment_issue"
    return "other"
