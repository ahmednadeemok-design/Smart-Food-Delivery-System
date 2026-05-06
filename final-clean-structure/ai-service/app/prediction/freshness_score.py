def calculate_freshness_score(estimated_minutes: int, actual_minutes: int, weather: str = "normal"):
    score = 100
    if actual_minutes > estimated_minutes:
        score -= (actual_minutes - estimated_minutes) * 2
    if weather == "rain":
        score -= 8
    elif weather == "hot":
        score -= 10
    elif weather == "storm":
        score -= 15
    score = max(0, min(100, round(score)))
    status = "fresh" if score >= 85 else "acceptable" if score >= 65 else "poor"
    return {"freshness_score": score, "status": status}
