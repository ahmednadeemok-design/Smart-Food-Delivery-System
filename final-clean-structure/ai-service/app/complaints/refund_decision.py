def decide_refund(intent: str, order_status: str = "", freshness_score: int = 100, order_total: float = 0):
    decision = "manual_review"
    refund_amount = 0

    if intent == "late_delivery" and freshness_score < 70:
        decision = "partial_refund"
        refund_amount = order_total * 0.25
    elif intent in ["missing_item", "wrong_item"]:
        decision = "manual_review_with_evidence_required"
    elif intent == "bad_quality" and freshness_score < 60:
        decision = "partial_refund"
        refund_amount = order_total * 0.20
    elif intent == "payment_issue":
        decision = "payment_team_review"

    return {"intent": intent, "decision": decision, "refund_amount": round(refund_amount, 2)}
