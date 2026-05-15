const ACTIVE_CONTACT_STATUSES = ["accepted", "preparing", "ready", "assigned", "picked", "on-the-way"];
const RIDER_CONTACT_STATUSES = ["assigned", "picked", "on-the-way"];
const RESTAURANT_CONTACT_STATUSES = ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way"];

const toPlain = (value) => {
  if (!value) return value;
  if (typeof value.toObject === "function") return value.toObject();
  return value;
};

const pickUser = (user, { includeEmail = false, includePhone = false } = {}) => {
  const source = toPlain(user);
  if (!source) return source;
  const picked = {
    _id: source._id,
    name: source.name,
    avatar: source.avatar,
  };
  if (includeEmail) picked.email = source.email;
  if (includePhone) picked.phone = source.phone;
  return picked;
};

const pickRestaurant = (restaurant, { includePhone = false, includeOwner = false } = {}) => {
  const source = toPlain(restaurant);
  if (!source) return source;
  const picked = {
    _id: source._id,
    name: source.name,
    description: source.description,
    address: source.address,
    localArea: source.localArea,
    location: source.location,
    image: source.image,
    logo: source.logo,
    banner: source.banner,
    cuisineTypes: source.cuisineTypes,
    businessHours: source.businessHours,
    isOpen: source.isOpen,
    approvalStatus: source.approvalStatus,
    averagePreparationTime: source.averagePreparationTime,
    kitchenLoad: source.kitchenLoad,
    rating: source.rating,
    totalReviews: source.totalReviews,
    deliveryFeeBase: source.deliveryFeeBase,
    offerText: source.offerText,
  };
  if (includePhone) {
    picked.phone = source.phone;
    picked.supportContact = source.supportContact;
  }
  if (includeOwner && source.owner) picked.owner = pickUser(source.owner, { includeEmail: true, includePhone: true });
  return picked;
};

const pickRider = (rider, { includeContact = false, includeLocation = false } = {}) => {
  const source = toPlain(rider);
  if (!source) return source;
  const picked = {
    _id: source._id,
    vehicleType: source.vehicleType,
    bikeNumber: source.bikeNumber,
    vehicleNumber: source.vehicleNumber,
    availabilityStatus: source.availabilityStatus,
  };
  if (includeLocation) picked.currentLocation = source.currentLocation;
  if (source.user) picked.user = pickUser(source.user, { includeEmail: includeContact, includePhone: includeContact });
  return picked;
};

const roleFrom = (reqOrRole) => {
  if (typeof reqOrRole === "string") return reqOrRole;
  return reqOrRole?.user?.role || "customer";
};

const sanitizeOrderForRole = (order, reqOrRole) => {
  const source = toPlain(order);
  if (!source) return source;
  const role = roleFrom(reqOrRole);
  const isAdmin = role === "admin";
  const isActiveContact = ACTIVE_CONTACT_STATUSES.includes(source.status);
  const canCustomerReachRider = (isAdmin || role === "customer") && Boolean(source.rider) && RIDER_CONTACT_STATUSES.includes(source.status);
  const canRiderReachParties = (isAdmin || role === "rider") && Boolean(source.rider) && RIDER_CONTACT_STATUSES.includes(source.status);
  const canRestaurantReachParties = (isAdmin || role === "restaurant") && RESTAURANT_CONTACT_STATUSES.includes(source.status);

  return {
    ...source,
    customer: pickUser(source.customer, {
      includeEmail: isAdmin || role === "restaurant",
      includePhone: isAdmin || canRiderReachParties || canRestaurantReachParties || role === "customer",
    }),
    restaurant: pickRestaurant(source.restaurant, {
      includePhone: isAdmin || role === "customer" || canRiderReachParties || canRestaurantReachParties,
      includeOwner: isAdmin,
    }),
    rider: pickRider(source.rider, {
      includeContact: isAdmin || canCustomerReachRider || canRestaurantReachParties || role === "rider",
      includeLocation: isAdmin || canCustomerReachRider || role === "rider" || canRestaurantReachParties,
    }),
    contactPermissions: {
      customer: {
        restaurant: role === "customer" && isActiveContact,
        rider: role === "customer" && canCustomerReachRider,
        support: role === "customer",
      },
      rider: {
        customer: role === "rider" && canRiderReachParties,
        restaurant: role === "rider" && canRiderReachParties,
      },
      restaurant: {
        customer: role === "restaurant" && canRestaurantReachParties,
        rider: role === "restaurant" && canRestaurantReachParties && Boolean(source.rider),
        adminSupport: role === "restaurant",
      },
      admin: {
        operationalContacts: isAdmin,
      },
    },
  };
};

const sanitizeOrdersForRole = (orders, reqOrRole) => (orders || []).map((order) => sanitizeOrderForRole(order, reqOrRole));

module.exports = {
  ACTIVE_CONTACT_STATUSES,
  RIDER_CONTACT_STATUSES,
  RESTAURANT_CONTACT_STATUSES,
  pickRestaurant,
  pickRider,
  pickUser,
  sanitizeOrderForRole,
  sanitizeOrdersForRole,
};
