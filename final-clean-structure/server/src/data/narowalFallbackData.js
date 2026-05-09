const fallbackRestaurants = [
  {
    _id: "fallback-zfc-narowal",
    name: "ZFC Narowal",
    description: "Fried chicken, burgers, and Railway Station fast food favourites.",
    phone: "+923000000009",
    address: "Narowal Railway Station, main entrance",
    localArea: "Narowal Railway Station",
    location: { lat: 32.0928, lng: 74.8695 },
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=900",
    logo: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=900",
    banner: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=900",
    cuisineTypes: ["Fast Food", "Fried Chicken", "Burger"],
    rating: 4.1,
    totalReviews: 41,
    kitchenLoad: "medium",
    averagePreparationTime: 22,
    trustScore: 87,
    isFeatured: true,
    isOpen: true,
    isActive: true,
    approvalStatus: "approved",
    deliveryFeeBase: 110,
    offerText: "COD available",
  },
  {
    _id: "fallback-palmer-restaurant",
    name: "Palmer Restaurant",
    description: "Desi, fast food, and family meals around Circular Road.",
    phone: "+923000000001",
    address: "Circular Road, near Narowal City Center",
    localArea: "Circular Road",
    location: { lat: 32.1020, lng: 74.8725 },
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=900",
    logo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=900",
    banner: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=900",
    cuisineTypes: ["Desi", "Fast Food", "Family Restaurant"],
    rating: 4.4,
    totalReviews: 44,
    kitchenLoad: "medium",
    averagePreparationTime: 22,
    trustScore: 93,
    isFeatured: true,
    isOpen: true,
    isActive: true,
    approvalStatus: "approved",
    deliveryFeeBase: 100,
    offerText: "NAROWAL50 eligible",
  },
  {
    _id: "fallback-buddys-narowal",
    name: "Buddy's Narowal",
    description: "Pizza, burgers, and student meals near UET Narowal Campus.",
    phone: "+923000000002",
    address: "UET Narowal Campus, Narowal",
    localArea: "UET Narowal Campus",
    location: { lat: 32.1042, lng: 74.8761 },
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900",
    logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900",
    banner: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900",
    cuisineTypes: ["Fast Food", "Pizza", "Burger"],
    rating: 4.3,
    totalReviews: 43,
    kitchenLoad: "high",
    averagePreparationTime: 28,
    trustScore: 90,
    isFeatured: true,
    isOpen: true,
    isActive: true,
    approvalStatus: "approved",
    deliveryFeeBase: 140,
    offerText: "Student deals",
  },
];

const fallbackMenu = {
  "fallback-zfc-narowal": [
    { _id: "fallback-zfc-zinger", restaurant: "fallback-zfc-narowal", name: "ZFC Mighty Zinger", description: "Crispy zinger burger prepared for Narowal COD delivery.", price: 650, image: fallbackRestaurants[0].image, category: "Burger", calories: 790, tags: ["burger", "fast-food"], isAvailable: true, tasteScore: 88, addOns: [{ name: "Cold drink", price: 120 }] },
    { _id: "fallback-zfc-bucket", restaurant: "fallback-zfc-narowal", name: "Fried Chicken Bucket", description: "Family-style fried chicken bucket with fresh fries.", price: 1950, image: fallbackRestaurants[0].image, category: "Fried Chicken", calories: 1600, tags: ["fried-chicken"], isAvailable: true, tasteScore: 90 },
  ],
  "fallback-palmer-restaurant": [
    { _id: "fallback-palmer-karahi", restaurant: "fallback-palmer-restaurant", name: "Palmer Special Chicken Karahi", description: "Rich chicken karahi for family dinners around Circular Road.", price: 1350, image: fallbackRestaurants[1].image, category: "Desi", calories: 920, tags: ["karahi"], isAvailable: true, tasteScore: 93 },
    { _id: "fallback-palmer-biryani", restaurant: "fallback-palmer-restaurant", name: "Chicken Biryani Plate", description: "Classic Narowal lunch plate with raita.", price: 380, image: fallbackRestaurants[1].image, category: "Rice", calories: 680, tags: ["biryani"], isAvailable: true, tasteScore: 89 },
  ],
  "fallback-buddys-narowal": [
    { _id: "fallback-buddys-pizza", restaurant: "fallback-buddys-narowal", name: "Buddy's Crown Crust Pizza", description: "Campus favourite pizza with loaded crust.", price: 1850, image: fallbackRestaurants[2].image, category: "Pizza", calories: 1180, tags: ["pizza"], isAvailable: true, tasteScore: 91 },
    { _id: "fallback-buddys-burger", restaurant: "fallback-buddys-narowal", name: "Loaded Beef Burger", description: "Loaded burger for UET Narowal students.", price: 760, image: fallbackRestaurants[2].image, category: "Burger", calories: 850, tags: ["burger"], isAvailable: true, tasteScore: 88 },
  ],
};

const matches = (value, term) => String(value || "").toLowerCase().includes(String(term || "").toLowerCase());

const getFallbackRestaurants = (query = {}) => {
  let list = [...fallbackRestaurants];
  if (query.area) list = list.filter((restaurant) => restaurant.localArea === query.area);
  if (query.cuisine) list = list.filter((restaurant) => (restaurant.cuisineTypes || []).includes(query.cuisine));
  if (query.q) {
    list = list.filter((restaurant) =>
      matches(restaurant.name, query.q) ||
      matches(restaurant.description, query.q) ||
      matches(restaurant.address, query.q) ||
      (restaurant.cuisineTypes || []).some((cuisine) => matches(cuisine, query.q))
    );
  }
  return list;
};

module.exports = {
  fallbackRestaurants,
  fallbackMenu,
  getFallbackRestaurants,
};
