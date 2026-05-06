exports.resolveComplaint = ({ complaintType, orderStatus, freshnessScore = 100 }) => {
  if (complaintType === "late_delivery" && freshnessScore < 70) {
    return { decision: "partial_refund", compensation: 100 };
  }

  if (["missing_item", "wrong_item", "bad_quality"].includes(complaintType)) {
    return { decision: "manual_review_required", compensation: 0 };
  }

  return { decision: "rejected_or_insufficient_evidence", compensation: 0 };
};
