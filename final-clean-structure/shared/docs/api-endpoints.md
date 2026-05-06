# SmartFood Narowal API Endpoints

Base URL: `http://127.0.0.1:5000/api`

## Auth
- `POST /auth/register` creates customer, rider, restaurant owner, or admin users.
- `POST /auth/login` returns JWT and user profile.
- `GET /auth/me` returns the current authenticated user.

## Restaurants And Menus
- `GET /restaurants` lists Narowal restaurants with address, local area, open status, kitchen load, rating, trust score, and coordinates.
- `GET /restaurants/:id` returns one restaurant.
- `GET /restaurants/:restaurantId/items` returns menu items.
- `GET /restaurants/mine` returns restaurant-owner profiles.
- `POST /restaurants` creates a restaurant profile.
- `PUT /restaurants/:id` updates restaurant profile and map location.
- `POST /restaurants/:restaurantId/items` creates a menu item.
- `PUT /restaurants/:restaurantId/items/:itemId` updates item details or availability.
- `DELETE /restaurants/:restaurantId/items/:itemId` deletes a menu item.

## Orders
- `POST /orders` creates a COD order with delivery fee, platform fee, service fee, OTP, and status timeline.
- `GET /orders/my` returns customer, restaurant, or rider scoped orders by role.
- `GET /orders/available` returns ready/pending orders available for riders.
- `POST /orders/:id/accept` assigns a rider.
- `PATCH /orders/:id/status` updates preparation, pickup, and delivery status timeline.
- `POST /orders/:id/verify-delivery` verifies customer OTP.

## Complaints, Reviews, Admin
- `POST /complaints` creates a complaint with AI decision support.
- `GET /complaints` lists complaints for admin.
- `PATCH /complaints/:id` updates complaint/refund status.
- `POST /reviews` creates restaurant or food review.
- `GET /reviews/restaurant/:restaurantId` lists restaurant reviews.
- `GET /system/health` returns protected admin system health, collection counts, revenue, riders, active orders, and Narowal zones.

## AI
- `GET /ai/recommendations`
- `POST /ai/delivery-time`
- `POST /ai/kitchen-load`
- `POST /ai/freshness-score`
- `POST /ai/order-accuracy`
- `POST /ai/complaint-intent`
- `POST /ai/refund-decision`
- `POST /ai/goal-filter`
