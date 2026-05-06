exports.calculateTrustChange = ({ actorType, event }) => {
  const rules = {
    late_delivery: -5,
    fake_complaint: -10,
    wrong_item: -8,
    successful_delivery: 2,
    good_review: 1,
  };

  return rules[event] || 0;
};
