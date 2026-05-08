# Narowal Smart Food Delivery Project Flow

1. Restaurant owner logs in and manages Narowal restaurant profiles and menu items.
2. Customer browses Narowal restaurants such as Palmer Restaurant, Buddy's Narowal, City Restaurant Narowal, and Virsa Restaurant Narowal.
3. Customer places an order with a Narowal delivery address.
4. Rider app uses Narowal city center as the default route center and demonstrates pickups/drop-offs around Main Bazaar, Circular Road, Railway Road, DHQ Hospital Area, and UET Narowal Campus.
5. Admin monitors Narowal restaurants, riders, complaints, refunds, trust scores, and heatmap zones.
6. AI recommendation uses restaurant/menu data from Narowal and falls back to Narowal sample menu items when no live menu payload is supplied.

## Clean Seed Flow

Run `npm run seed:narowal` inside `server` before an FYP demo. The seed clears old MongoDB data from the main platform collections and rebuilds one clean Narowal dataset with users, restaurant owner, admin, riders, restaurants, menus, orders, COD payments, reviews, and complaints.

## Map Flow

- Customer restaurant details show an OpenStreetMap location for the selected restaurant.
- Customer checkout shows a delivery pin for saved Narowal delivery areas.
- Rider app shows pickup/drop-off route points around Narowal.
- Restaurant panel lets owners update latitude and longitude.
- Admin analytics shows a Narowal distribution map for operating zones.
