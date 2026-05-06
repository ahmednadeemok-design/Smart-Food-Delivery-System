export const mockAvailableOrders = [
  {_id:"ORD-1001", restaurantName:"Biryani House", customerName:"Ahmed", pickup:"Main Bazaar Narowal", dropoff:"UET Narowal Campus", distanceKm:3.2, amount:1450, emergencyMode:true, status:"ready"},
  {_id:"ORD-1002", restaurantName:"Pizza Corner", customerName:"Mahtab", pickup:"Circular Road", dropoff:"Hostel Area", distanceKm:2.4, amount:2200, emergencyMode:false, status:"ready"},
  {_id:"ORD-1003", restaurantName:"Fresh Cafe", customerName:"Khurram", pickup:"Zafarwal Road", dropoff:"Railway Road", distanceKm:4.1, amount:980, emergencyMode:false, status:"ready"}
];
export const routeStops = [
  { id: 1, label: "Pickup: Biryani House", eta: "0 min", type: "pickup" },
  { id: 2, label: "Pickup: Pizza Corner", eta: "8 min", type: "pickup" },
  { id: 3, label: "Drop: UET Narowal Campus", eta: "17 min", type: "drop" },
  { id: 4, label: "Drop: Hostel Area", eta: "25 min", type: "drop" }
];
