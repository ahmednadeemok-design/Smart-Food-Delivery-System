export const mockAvailableOrders = [
  {_id:"ORD-NWL-1001", restaurantName:"Palmer Restaurant", customerName:"Ahmed", pickup:"Circular Road, Narowal", dropoff:"UET Narowal Campus", distanceKm:3.2, amount:1450, emergencyMode:true, status:"ready"},
  {_id:"ORD-NWL-1002", restaurantName:"Buddy's Narowal", customerName:"Mahtab", pickup:"UET Narowal Campus", dropoff:"Main Bazaar Narowal", distanceKm:2.4, amount:2200, emergencyMode:false, status:"ready"},
  {_id:"ORD-NWL-1003", restaurantName:"Moon Grill Restaurant", customerName:"Khurram", pickup:"Railway Road, Narowal", dropoff:"Zafarwal Road", distanceKm:4.1, amount:980, emergencyMode:false, status:"ready"}
];

export const routeStops = [
  { id: 1, label: "Pickup: Palmer Restaurant (Circular Road)", eta: "0 min", type: "pickup" },
  { id: 2, label: "Pickup: Buddy's Narowal (UET Narowal Campus)", eta: "8 min", type: "pickup" },
  { id: 3, label: "Drop: UET Narowal Campus", eta: "17 min", type: "drop" },
  { id: 4, label: "Drop: Main Bazaar Narowal", eta: "25 min", type: "drop" }
];
