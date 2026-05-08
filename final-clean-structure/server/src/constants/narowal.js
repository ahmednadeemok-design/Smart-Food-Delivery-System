const NAROWAL_CENTER = { lat: 32.1020, lng: 74.8740 };

const NAROWAL_AREAS = [
  "UET Narowal Campus",
  "Railway Road",
  "Main Bazaar",
  "Circular Road",
  "Zafarwal Road",
  "Shakargarh Road",
  "New Lahore Road",
  "DHQ Hospital Area",
  "Narowal Railway Station",
];

const NAROWAL_AREA_LOCATIONS = {
  "UET Narowal Campus": { lat: 32.1135, lng: 74.8734 },
  "Railway Road": { lat: 32.0990, lng: 74.8678 },
  "Main Bazaar": { lat: 32.1008, lng: 74.8712 },
  "Circular Road": { lat: 32.1020, lng: 74.8725 },
  "Zafarwal Road": { lat: 32.0975, lng: 74.8842 },
  "Shakargarh Road": { lat: 32.1071, lng: 74.8669 },
  "New Lahore Road": { lat: 32.0954, lng: 74.8788 },
  "DHQ Hospital Area": { lat: 32.1058, lng: 74.8792 },
  "Narowal Railway Station": { lat: 32.0992, lng: 74.8669 },
};

const COUPONS = {
  NAROWAL50: { code: "NAROWAL50", type: "flat", value: 50, minSubtotal: 350 },
  UET100: { code: "UET100", type: "flat", value: 100, minSubtotal: 800, area: "UET Narowal Campus" },
  BAZAAR10: { code: "BAZAAR10", type: "percent", value: 10, maxDiscount: 180, minSubtotal: 600 },
};

const normalizePhone = (phone = "") => phone.replace(/\s|-/g, "");

const isPakistaniPhone = (phone = "") => /^\+923\d{9}$/.test(normalizePhone(phone));

const resolveNarowalArea = (value = "") => {
  const text = value.toLowerCase();
  return NAROWAL_AREAS.find((area) => text.includes(area.toLowerCase())) || "";
};

const isNarowalAddress = (address = "") => Boolean(resolveNarowalArea(address));

const clampLocation = (location = {}) => {
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NAROWAL_CENTER;
  return { lat, lng };
};

const calculateCouponDiscount = ({ code, subtotal, deliveryAddress }) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return { code: "", discount: 0, message: "" };

  const coupon = COUPONS[normalizedCode];
  if (!coupon) return { code: normalizedCode, discount: 0, message: "Coupon is not valid for Narowal" };
  if (subtotal < coupon.minSubtotal) {
    return { code: normalizedCode, discount: 0, message: `Minimum subtotal is PKR ${coupon.minSubtotal}` };
  }
  if (coupon.area && resolveNarowalArea(deliveryAddress) !== coupon.area) {
    return { code: normalizedCode, discount: 0, message: `${coupon.code} is only for ${coupon.area}` };
  }

  const rawDiscount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const discount = Math.min(rawDiscount, coupon.maxDiscount || rawDiscount, subtotal);
  return { code: normalizedCode, discount, message: "Coupon applied" };
};

module.exports = {
  NAROWAL_AREAS,
  NAROWAL_AREA_LOCATIONS,
  NAROWAL_CENTER,
  COUPONS,
  calculateCouponDiscount,
  clampLocation,
  isNarowalAddress,
  isPakistaniPhone,
  normalizePhone,
  resolveNarowalArea,
};
