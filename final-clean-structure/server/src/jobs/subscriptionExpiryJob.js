const Subscription = require("../models/Subscription");

const subscriptionExpiryJob = async () => {
  await Subscription.updateMany({ expiryDate: { $lt: new Date() } }, { isActive: false });
};

module.exports = subscriptionExpiryJob;
