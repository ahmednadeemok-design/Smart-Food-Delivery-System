const Payment = require("../models/Payment");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const FinanceTransaction = require("../models/FinanceTransaction");
const CODCollection = require("../models/CODCollection");
const Settlement = require("../models/Settlement");
const PayoutRequest = require("../models/PayoutRequest");

const PLATFORM_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENT || 15);
const RIDER_DELIVERY_FEE_SHARE_PERCENT = Number(process.env.RIDER_DELIVERY_FEE_SHARE_PERCENT || 80);

const round = (value) => Math.max(0, Math.round(Number(value || 0)));
const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date = new Date()) => {
  const day = startOfDay(date);
  day.setDate(day.getDate() - day.getDay());
  return day;
};
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const last4 = (value = "") => String(value || "").replace(/\s+/g, "").slice(-4);

const createLedger = (payload) =>
  FinanceTransaction.findOneAndUpdate(
    { referenceKey: payload.referenceKey },
    { $setOnInsert: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

exports.calculateOrderFinancials = ({ subtotal, deliveryFee, platformFee, serviceFee, discountAmount = 0, taxAmount = 0 }) => {
  const platformCommission = round((subtotal * PLATFORM_COMMISSION_PERCENT) / 100);
  const riderEarning = Math.max(80, round((deliveryFee * RIDER_DELIVERY_FEE_SHARE_PERCENT) / 100));
  const restaurantRevenue = round(subtotal - discountAmount - platformCommission);
  const platformEarning = round(platformCommission + platformFee + serviceFee + Math.max(0, deliveryFee - riderEarning));
  const totalAmount = round(subtotal + deliveryFee + platformFee + serviceFee + taxAmount - discountAmount);

  return {
    subtotal: round(subtotal),
    deliveryFee: round(deliveryFee),
    platformFee: round(platformFee),
    serviceFee: round(serviceFee),
    discountAmount: round(discountAmount),
    taxAmount: round(taxAmount),
    totalAmount,
    platformCommission,
    restaurantRevenue,
    riderEarning,
    platformEarning,
    commissionRate: PLATFORM_COMMISSION_PERCENT,
  };
};

exports.recordOrderReserved = async (order, payment) => {
  if (!order?._id) return null;
  return createLedger({
    referenceKey: `order:${order._id}:reserved`,
    type: "order_reserved",
    status: "reserved",
    direction: "neutral",
    actorType: "platform",
    order: order._id,
    payment: payment?._id,
    restaurant: order.restaurant,
    rider: order.rider,
    amount: round(order.totalAmount),
    balanceImpact: {
      platformEarning: 0,
      restaurantLiability: 0,
      riderLiability: 0,
      codInCirculation: 0,
      refundLiability: 0,
    },
    metadata: {
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      platformFee: order.platformFee,
      serviceFee: order.serviceFee,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
    },
    note: "Order value reserved until delivery or cancellation.",
  });
};

exports.settleCodDelivery = async (order) => {
  if (!order || order.financialSettled) return order;

  const isCod = (order.paymentMethod || "cod") === "cod";
  order.paymentStatus = isCod ? "cash_collected" : "paid_online";
  order.cashCollectedAmount = isCod ? round(order.totalAmount) : 0;
  order.financialSettled = true;
  order.settledAt = new Date();

  if (order.rider) {
    await Rider.findByIdAndUpdate(order.rider, {
      $pull: { activeOrders: order._id },
      $unset: { activeOrder: "" },
      $inc: {
        completedDeliveries: 1,
        earnings: order.riderEarning || 0,
        dailyEarnings: order.riderEarning || 0,
        weeklyEarnings: order.riderEarning || 0,
        walletBalance: order.riderEarning || 0,
        pendingPayout: order.riderEarning || 0,
        totalLifetimeEarnings: order.riderEarning || 0,
        codCollectedToday: order.cashCollectedAmount || 0,
      },
      availabilityStatus: "online",
      isOnline: true,
    });
  }

  await Restaurant.findByIdAndUpdate(order.restaurant, {
    $inc: {
      totalSales: order.totalAmount || 0,
      totalRevenue: order.restaurantRevenue || 0,
      pendingSettlement: order.restaurantRevenue || 0,
      completedSales: order.restaurantRevenue || 0,
      platformCommission: order.platformCommission || 0,
      completedOrders: 1,
    },
  });

  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      order: order._id,
      user: order.customer,
      amount: order.totalAmount,
      method: order.paymentMethod || "cod",
      status: isCod ? "cash_collected" : "paid_online",
      rider: order.rider,
      restaurant: order.restaurant,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      platformFee: order.platformFee,
      serviceFee: order.serviceFee,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      platformCommission: order.platformCommission,
      restaurantRevenue: order.restaurantRevenue,
      riderEarning: order.riderEarning,
      cashCollectedAmount: order.cashCollectedAmount,
      collectedAt: new Date(),
      transactionId: `COD-${String(order._id).slice(-8).toUpperCase()}`,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const payment = await Payment.findOne({ order: order._id });
  await Promise.all([
    isCod
      ? CODCollection.findOneAndUpdate(
          { referenceKey: `order:${order._id}:cod` },
          {
            $setOnInsert: {
              referenceKey: `order:${order._id}:cod`,
              order: order._id,
              rider: order.rider,
              restaurant: order.restaurant,
              customer: order.customer,
              amount: round(order.cashCollectedAmount),
              status: "collected",
              collectedAt: new Date(),
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
      : null,
    Settlement.findOneAndUpdate(
      { referenceKey: `order:${order._id}:restaurant` },
      {
        $setOnInsert: {
          referenceKey: `order:${order._id}:restaurant`,
          restaurant: order.restaurant,
          order: order._id,
          grossAmount: round(order.subtotal - order.discountAmount),
          commissionAmount: round(order.platformCommission),
          netAmount: round(order.restaurantRevenue),
          status: "pending",
          note: "Restaurant settlement created after delivery.",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
    createLedger({
      referenceKey: `order:${order._id}:cod_collected`,
      type: "cod_collected",
      status: "posted",
      direction: "credit",
      actorType: order.rider ? "rider" : "platform",
      actor: order.rider || undefined,
      actorModel: order.rider ? "Rider" : undefined,
      order: order._id,
      payment: payment?._id,
      restaurant: order.restaurant,
      rider: order.rider,
      amount: round(order.cashCollectedAmount),
      balanceImpact: { codInCirculation: round(order.cashCollectedAmount) },
      note: "COD collected from customer on delivery.",
    }),
    order.rider
      ? createLedger({
          referenceKey: `order:${order._id}:rider_earning`,
          type: "rider_earning",
          status: "posted",
          direction: "credit",
          actorType: "rider",
          actor: order.rider,
          actorModel: "Rider",
          order: order._id,
          payment: payment?._id,
          restaurant: order.restaurant,
          rider: order.rider,
          amount: round(order.riderEarning),
          balanceImpact: { riderLiability: round(order.riderEarning) },
          note: "Rider delivery earning posted.",
        })
      : null,
    createLedger({
      referenceKey: `order:${order._id}:restaurant_settlement`,
      type: "restaurant_settlement",
      status: "posted",
      direction: "credit",
      actorType: "restaurant",
      actor: order.restaurant,
      actorModel: "Restaurant",
      order: order._id,
      payment: payment?._id,
      restaurant: order.restaurant,
      rider: order.rider,
      amount: round(order.restaurantRevenue),
      balanceImpact: { restaurantLiability: round(order.restaurantRevenue) },
      note: "Restaurant net settlement posted.",
    }),
    createLedger({
      referenceKey: `order:${order._id}:platform_earning`,
      type: "platform_earning",
      status: "posted",
      direction: "credit",
      actorType: "platform",
      order: order._id,
      payment: payment?._id,
      restaurant: order.restaurant,
      rider: order.rider,
      amount: round(order.platformEarning),
      balanceImpact: { platformEarning: round(order.platformEarning) },
      metadata: { commissionAmount: order.platformCommission },
      note: "Platform commission, service, and fee earning posted.",
    }),
  ]);

  return order;
};

exports.recordRefundLedger = async ({ order, payment, amount, reason }) => {
  if (!order?._id || !payment?._id) return null;
  const refundAmount = Math.min(round(amount), round(payment.amount || order.totalAmount));
  return createLedger({
    referenceKey: `payment:${payment._id}:refund:${refundAmount}`,
    type: "refund_liability",
    status: "posted",
    direction: "debit",
    actorType: "platform",
    order: order._id,
    payment: payment._id,
    restaurant: order.restaurant,
    rider: order.rider,
    amount: refundAmount,
    balanceImpact: { refundLiability: refundAmount, platformEarning: -refundAmount },
    note: reason || "Refund liability posted by admin.",
  });
};

exports.getRiderFinance = async (rider) => {
  const now = new Date();
  const [transactions, payouts, codCollections, todayOrders, weekOrders, monthOrders] = await Promise.all([
    FinanceTransaction.find({ rider: rider._id }).populate("order", "status totalAmount deliveredAt").populate("restaurant", "name localArea").sort("-createdAt").limit(80),
    PayoutRequest.find({ rider: rider._id }).sort("-createdAt").limit(30),
    CODCollection.find({ rider: rider._id }).populate("order", "totalAmount status").populate("restaurant", "name").sort("-createdAt").limit(50),
    FinanceTransaction.find({ rider: rider._id, type: "rider_earning", createdAt: { $gte: startOfDay(now) } }),
    FinanceTransaction.find({ rider: rider._id, type: "rider_earning", createdAt: { $gte: startOfWeek(now) } }),
    FinanceTransaction.find({ rider: rider._id, type: "rider_earning", createdAt: { $gte: startOfMonth(now) } }),
  ]);
  const sum = (rows) => rows.reduce((total, row) => total + round(row.amount), 0);
  return {
    summary: {
      todayEarnings: sum(todayOrders),
      weeklyEarnings: sum(weekOrders),
      monthlyEarnings: sum(monthOrders),
      pendingPayout: round(rider.pendingPayout),
      walletBalance: round(rider.walletBalance),
      codCollected: codCollections.reduce((total, row) => total + round(row.amount), 0),
      completedDeliveries: rider.completedDeliveries || 0,
      trustScore: rider.trustScore || 100,
      cancellationPenalties: 0,
      incentives: 0,
      bonuses: 0,
    },
    transactions,
    payouts,
    codCollections,
  };
};

exports.getRestaurantFinance = async (restaurant) => {
  const now = new Date();
  const [transactions, payouts, settlements, todaySales, weekSales, monthSales] = await Promise.all([
    FinanceTransaction.find({ restaurant: restaurant._id }).populate("order", "status totalAmount deliveredAt").populate({ path: "rider", populate: { path: "user", select: "name" } }).sort("-createdAt").limit(80),
    PayoutRequest.find({ restaurant: restaurant._id }).sort("-createdAt").limit(30),
    Settlement.find({ restaurant: restaurant._id }).populate("order", "status totalAmount deliveredAt").sort("-createdAt").limit(50),
    FinanceTransaction.find({ restaurant: restaurant._id, type: "restaurant_settlement", createdAt: { $gte: startOfDay(now) } }),
    FinanceTransaction.find({ restaurant: restaurant._id, type: "restaurant_settlement", createdAt: { $gte: startOfWeek(now) } }),
    FinanceTransaction.find({ restaurant: restaurant._id, type: "restaurant_settlement", createdAt: { $gte: startOfMonth(now) } }),
  ]);
  const sum = (rows) => rows.reduce((total, row) => total + round(row.amount), 0);
  const refundImpact = transactions.filter((row) => row.type === "refund_liability").reduce((total, row) => total + round(row.amount), 0);
  return {
    summary: {
      todayRevenue: sum(todaySales),
      weeklyRevenue: sum(weekSales),
      monthlyRevenue: sum(monthSales),
      pendingSettlement: round(restaurant.pendingSettlement),
      completedPayouts: payouts.filter((item) => item.status === "completed").reduce((total, item) => total + round(item.amount), 0),
      commissionDeductions: round(restaurant.platformCommission),
      refundImpact,
      cancellationImpact: restaurant.cancelledOrders || 0,
      payoutSchedule: "Manual admin approval after COD reconciliation",
    },
    transactions,
    payouts,
    settlements,
  };
};

exports.createPayoutRequest = async ({ requesterType, rider, restaurant, user, amount, notes }) => {
  const source = requesterType === "rider" ? rider : restaurant;
  if (!source) throw new Error("Finance profile not found");
  const available = requesterType === "rider" ? round(source.pendingPayout) : round(source.pendingSettlement);
  const requestedAmount = amount === undefined || amount === null || amount === "" ? available : round(amount);
  if (requestedAmount < 1) throw new Error("Payout amount must be greater than zero");
  if (requestedAmount > available) throw new Error("Payout amount exceeds available pending balance");
  const pendingQuery = requesterType === "rider" ? { rider: source._id } : { restaurant: source._id };
  const existingPending = await PayoutRequest.findOne({
    requesterType,
    ...pendingQuery,
    status: { $in: ["pending", "processing"] },
  });
  if (existingPending) throw new Error("A payout request is already pending review for this account");

  const payout = await PayoutRequest.create({
    requesterType,
    rider: rider?._id,
    restaurant: restaurant?._id,
    requestedBy: user._id,
    amount: requestedAmount,
    payoutMethod: source.paymentAccountType || source.bankAccountType || "",
    accountTitle: source.accountTitle || source.payoutAccountTitle || "",
    accountLast4: last4(source.paymentAccountNumber || source.bankAccountNumber || source.paymentAccount?.number),
    ibanLast4: last4(source.iban || source.paymentAccount?.iban),
    notes,
  });

  await createLedger({
    referenceKey: `payout:${payout._id}:requested`,
    type: "payout_requested",
    status: "pending",
    direction: "debit",
    actorType: requesterType,
    actor: source._id,
    actorModel: requesterType === "rider" ? "Rider" : "Restaurant",
    restaurant: restaurant?._id,
    rider: rider?._id,
    payoutRequest: payout._id,
    amount: requestedAmount,
    balanceImpact: requesterType === "rider" ? { riderLiability: requestedAmount } : { restaurantLiability: requestedAmount },
    note: "Payout request submitted for admin approval.",
  });

  return payout;
};

exports.updatePayoutStatus = async ({ payout, status, admin, notes }) => {
  if (!["pending", "processing", "completed", "failed", "rejected"].includes(status)) throw new Error("Invalid payout status");
  if (["completed", "failed", "rejected"].includes(payout.status)) throw new Error("Finalized payout requests cannot be changed");

  payout.status = status;
  payout.reviewedBy = admin._id;
  payout.adminNotes = notes || payout.adminNotes;
  if (status === "processing") payout.processedAt = new Date();
  if (status === "completed") payout.completedAt = new Date();
  if (status === "failed") {
    payout.failedAt = new Date();
    payout.failureReason = notes || "Marked failed by finance admin";
  }
  if (status === "rejected") payout.rejectedAt = new Date();
  await payout.save();

  if (status === "completed") {
    if (payout.requesterType === "rider") {
      await Rider.findByIdAndUpdate(payout.rider, {
        $inc: { pendingPayout: -round(payout.amount), walletBalance: -round(payout.amount) },
      });
    } else {
      await Restaurant.findByIdAndUpdate(payout.restaurant, {
        $inc: { pendingSettlement: -round(payout.amount) },
      });
      let remaining = round(payout.amount);
      const settlements = await Settlement.find({ restaurant: payout.restaurant, status: { $in: ["pending", "processing"] } }).sort("createdAt");
      for (const settlement of settlements) {
        if (remaining <= 0) break;
        const unpaid = Math.max(0, round(settlement.netAmount) - round(settlement.paidAmount));
        const applied = Math.min(unpaid, remaining);
        settlement.paidAmount = round(settlement.paidAmount) + applied;
        settlement.payoutRequest = payout._id;
        settlement.status = settlement.paidAmount >= round(settlement.netAmount) ? "paid" : "processing";
        settlement.settledAt = settlement.status === "paid" ? new Date() : settlement.settledAt;
        remaining -= applied;
        await settlement.save();
      }
    }
  }

  if (["completed", "failed", "rejected"].includes(status)) {
    await createLedger({
      referenceKey: `payout:${payout._id}:${status}`,
      type: status === "completed" ? "payout_completed" : status === "failed" ? "payout_failed" : "payout_rejected",
      status: status === "completed" ? "posted" : "failed",
      direction: "debit",
      actorType: payout.requesterType,
      actor: payout.rider || payout.restaurant,
      actorModel: payout.requesterType === "rider" ? "Rider" : "Restaurant",
      restaurant: payout.restaurant,
      rider: payout.rider,
      payoutRequest: payout._id,
      amount: round(payout.amount),
      balanceImpact: payout.requesterType === "rider" ? { riderLiability: -round(payout.amount) } : { restaurantLiability: -round(payout.amount) },
      note: notes || `Payout ${status}.`,
    });
  }
  return payout;
};

exports.financeOverview = async () => {
  const [transactions, payouts, codCollections, restaurantLiability, riderLiability, restaurants, riders] = await Promise.all([
    FinanceTransaction.find().populate("order", "status totalAmount").populate("restaurant", "name").populate({ path: "rider", populate: { path: "user", select: "name" } }).sort("-createdAt").limit(100),
    PayoutRequest.find().populate("restaurant", "name").populate({ path: "rider", populate: { path: "user", select: "name" } }).sort("-createdAt").limit(100),
    CODCollection.find().populate("restaurant", "name").populate({ path: "rider", populate: { path: "user", select: "name" } }).sort("-createdAt").limit(100),
    Restaurant.aggregate([{ $group: { _id: null, total: { $sum: "$pendingSettlement" } } }]),
    Rider.aggregate([{ $group: { _id: null, total: { $sum: "$pendingPayout" } } }]),
    Restaurant.find().select("name localArea pendingSettlement platformCommission").sort("-updatedAt").limit(100),
    Rider.find().select("user pendingPayout walletBalance completedDeliveries").populate("user", "name phone").sort("-updatedAt").limit(100),
  ]);
  const sumBy = (type) => transactions.filter((tx) => tx.type === type).reduce((sum, tx) => sum + round(tx.amount), 0);
  const restaurantLiabilities = round(restaurantLiability[0]?.total || 0);
  const riderLiabilities = round(riderLiability[0]?.total || 0);
  return {
    totals: {
      platformEarnings: sumBy("platform_earning"),
      commissionRevenue: transactions.reduce((sum, tx) => sum + round(tx.metadata?.commissionAmount), 0),
      codInCirculation: codCollections.filter((item) => item.status !== "reconciled").reduce((sum, item) => sum + round(item.amount), 0),
      pendingLiabilities: round(restaurantLiabilities + riderLiabilities),
      riderLiabilities,
      restaurantLiabilities,
      refundLiabilities: sumBy("refund_liability"),
      pendingPayoutRequests: payouts.filter((item) => ["pending", "processing"].includes(item.status)).reduce((sum, item) => sum + round(item.amount), 0),
    },
    transactions,
    payouts,
    codCollections,
    restaurants,
    riders,
  };
};
