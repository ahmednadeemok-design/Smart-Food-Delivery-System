const Payment = require("../models/Payment");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");

const PLATFORM_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENT || 15);
const RIDER_DELIVERY_FEE_SHARE_PERCENT = Number(process.env.RIDER_DELIVERY_FEE_SHARE_PERCENT || 80);

const round = (value) => Math.max(0, Math.round(Number(value || 0)));

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

  return order;
};
