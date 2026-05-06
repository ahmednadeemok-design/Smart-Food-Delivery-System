# SmartFood Narowal Database Schema

Database: `smart-food-delivery`

The Narowal seed resets these collections before inserting fresh data: `users`, `restaurants`, `fooditems`, `orders`, `riders`, `complaints`, `payments`, and `subscriptions`. It also clears related demo collections such as reviews, trust scores, and delivery verifications.

## users
- Customer, rider, restaurant owner, and admin accounts.
- Important fields: `name`, `email`, `phone`, `role`, `address`, `location`, `trustScore`, `healthProfile`.

## restaurants
- Narowal restaurants with owner relation.
- Important fields: `owner`, `name`, `address`, `localArea`, `location`, `cuisineTypes`, `isOpen`, `kitchenLoad`, `averagePreparationTime`, `accuracyRate`, `trustScore`, `rating`.
- Coordinates are approximate for demo map rendering.

## fooditems
- Menu items linked to restaurants.
- Important fields: `restaurant`, `name`, `price`, `category`, `calories`, `tags`, `isAvailable`, `tasteScore`, `complaintCount`.

## orders
- Customer orders linked to restaurant, optional rider, and food items.
- Important fields: `customer`, `restaurant`, `rider`, `items`, `deliveryAddress`, `deliveryLocation`, `status`, `paymentMethod`, `subtotal`, `deliveryFee`, `platformFee`, `serviceFee`, `totalAmount`, `otp`, `statusTimeline`.

## riders
- Rider profile linked to user.
- Important fields: `user`, `vehicleType`, `currentLocation`, `isOnline`, `activeOrders`, `workloadScore`, `trustScore`, `completedDeliveries`.

## complaints
- Complaint and refund support linked to order/customer.
- Important fields: `order`, `customer`, `type`, `description`, `status`, `aiDecision`, `compensation`.

## payments
- COD and simulated digital payments linked to order/user.
- Important fields: `order`, `user`, `amount`, `method`, `status`, `transactionId`.

## subscriptions
- Optional customer subscription data.
- Important fields: `user`, `plan`, `status`, `startDate`, `expiryDate`.
