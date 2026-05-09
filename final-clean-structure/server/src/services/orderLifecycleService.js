const ACTIVE_ORDER_STATUSES = ["pending", "accepted", "preparing", "ready", "assigned", "picked"];
const TERMINAL_ORDER_STATUSES = ["delivered", "cancelled", "rejected"];

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const getArchiveAgeDays = () => {
  const parsed = Number.parseInt(process.env.ORDER_ARCHIVE_AFTER_DAYS, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const applyArchiveWindow = async (Order, baseQuery = {}) => {
  const ageDays = getArchiveAgeDays();
  const cutoff = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
  await Order.updateMany(
    {
      ...baseQuery,
      status: { $in: TERMINAL_ORDER_STATUSES },
      isArchived: { $ne: true },
      updatedAt: { $lte: cutoff },
    },
    { $set: { isArchived: true, archivedAt: new Date() } }
  );
};

const markArchivedIfTerminal = (order) => {
  if (!order || !TERMINAL_ORDER_STATUSES.includes(order.status)) return;
  order.isArchived = true;
  order.archivedAt = order.archivedAt || new Date();
};

const buildOrderScopeQuery = ({ view = "active", status, search }) => {
  const query = {};
  if (view === "active") {
    query.status = { $in: ACTIVE_ORDER_STATUSES };
    query.isArchived = { $ne: true };
  } else if (view === "archived" || view === "history") {
    query.$or = [{ isArchived: true }, { status: { $in: TERMINAL_ORDER_STATUSES } }];
  }

  if (status) {
    query.status = status;
    if (view === "active" && !ACTIVE_ORDER_STATUSES.includes(status)) query._id = null;
    if ((view === "archived" || view === "history") && !TERMINAL_ORDER_STATUSES.includes(status)) query._id = null;
  }

  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { deliveryAddress: regex },
        { paymentMethod: regex },
        { paymentStatus: regex },
      ],
    });
  }
  return query;
};

const paginationFromQuery = (query = {}) => {
  const page = toPositiveInt(query.page, 1, 10000);
  const limit = toPositiveInt(query.limit, 25, 100);
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = {
  ACTIVE_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildOrderScopeQuery,
  markArchivedIfTerminal,
  paginationFromQuery,
};
