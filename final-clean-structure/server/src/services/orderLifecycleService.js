const ACTIVE_ORDER_STATUSES = ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way"];
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

const appendDateRange = (query, { from, to } = {}) => {
  const range = {};
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) range.$gte = fromDate;
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      range.$lte = toDate;
    }
  }
  if (Object.keys(range).length) query.createdAt = range;
};

const buildOrderScopeQuery = ({ view = "active", status, search, from, to } = {}) => {
  const query = {};
  if (view === "active") {
    query.status = { $in: ACTIVE_ORDER_STATUSES };
    query.isArchived = { $ne: true };
    query.isDeleted = { $ne: true };
  } else if (view === "archived" || view === "history") {
    query.$or = [{ isArchived: true }, { status: { $in: TERMINAL_ORDER_STATUSES } }];
    query.isDeleted = { $ne: true };
  } else if (view === "trash") {
    query.isDeleted = true;
  }

  if (status) {
    query.status = status;
    if (view === "active" && !ACTIVE_ORDER_STATUSES.includes(status)) query._id = null;
    if ((view === "archived" || view === "history") && !TERMINAL_ORDER_STATUSES.includes(status)) query._id = null;
    if (view === "trash" && !TERMINAL_ORDER_STATUSES.includes(status)) query._id = null;
  }

  appendDateRange(query, { from, to });

  if (search) {
    const rawSearch = String(search).trim();
    const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { status: regex },
        { deliveryAddress: regex },
        { paymentMethod: regex },
        { paymentStatus: regex },
        { refundStatus: regex },
        { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: escaped, options: "i" } } },
      ],
    });
  }
  return query;
};

const enrichOrderSearchQuery = async ({ query, search, User, Restaurant }) => {
  const rawSearch = String(search || "").trim();
  if (!rawSearch) return query;
  const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const [customers, restaurants] = await Promise.all([
    User ? User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select("_id").limit(50) : [],
    Restaurant ? Restaurant.find({ $or: [{ name: regex }, { address: regex }, { localArea: regex }] }).select("_id").limit(50) : [],
  ]);
  const searchOr = [];
  if (customers.length) searchOr.push({ customer: { $in: customers.map((item) => item._id) } });
  if (restaurants.length) searchOr.push({ restaurant: { $in: restaurants.map((item) => item._id) } });
  if (!searchOr.length) return query;
  query.$and = query.$and || [];
  const existingSearch = query.$and.find((part) => Array.isArray(part.$or));
  if (existingSearch) existingSearch.$or.push(...searchOr);
  else query.$and.push({ $or: searchOr });
  return query;
};

const paginationFromQuery = (query = {}) => {
  const page = toPositiveInt(query.page, 1, 10000);
  const limit = toPositiveInt(query.limit, 25, 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getDeletedCleanupAgeDays = () => {
  const parsed = Number.parseInt(process.env.ORDER_DELETE_AFTER_DAYS, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 90;
};

const deletedCleanupCutoff = (days = getDeletedCleanupAgeDays()) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const buildDeletedCleanupQuery = (days) => ({
  isDeleted: true,
  deletedAt: { $lte: deletedCleanupCutoff(days) },
});

module.exports = {
  ACTIVE_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildDeletedCleanupQuery,
  buildOrderScopeQuery,
  enrichOrderSearchQuery,
  getDeletedCleanupAgeDays,
  markArchivedIfTerminal,
  paginationFromQuery,
};
