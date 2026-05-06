def generate_complaint_reply(intent: str):
    replies = {
        "late_delivery": "Late delivery issue detected. I will check rider status and freshness score.",
        "missing_item": "Missing item issue detected. Please upload order image as evidence.",
        "wrong_item": "Wrong item issue detected. The system will compare order details.",
        "bad_quality": "Quality complaint detected. This may affect restaurant taste score.",
        "payment_issue": "Payment issue detected. It will be reviewed for refund.",
        "other": "Please provide more details for classification."
    }
    return replies.get(intent, replies["other"])
