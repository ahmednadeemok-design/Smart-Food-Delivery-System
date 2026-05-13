const Order = require("../models/Order");
const {
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildDeletedCleanupQuery,
  getDeletedCleanupAgeDays,
} = require("../services/orderLifecycleService");

const archiveEligibleOrders = async (baseQuery = {}) => {
  await applyArchiveWindow(Order, baseQuery);
  return Order.countDocuments({
    ...baseQuery,
    status: { $in: TERMINAL_ORDER_STATUSES },
    isArchived: true,
  });
};

const getDeletedOrdersEligibleForCleanup = (days = getDeletedCleanupAgeDays()) =>
  Order.find(buildDeletedCleanupQuery(days)).sort("deletedAt");

const permanentlyCleanupDeletedOrders = async ({ days = getDeletedCleanupAgeDays(), dryRun = true } = {}) => {
  const query = buildDeletedCleanupQuery(days);
  const eligible = await Order.countDocuments(query);
  if (dryRun) return { eligible, deleted: 0, dryRun: true, days };
  const result = await Order.deleteMany(query);
  return { eligible, deleted: result.deletedCount || 0, dryRun: false, days };
};

module.exports = {
  archiveEligibleOrders,
  getDeletedOrdersEligibleForCleanup,
  permanentlyCleanupDeletedOrders,
};
