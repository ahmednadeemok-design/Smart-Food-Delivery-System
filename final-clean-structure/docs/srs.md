# SRS Notes: Narowal Smart Food Delivery

## Geographic Scope

The system targets Narowal city food delivery. Default coordinates are centered near Narowal city center
at approximately `32.1014, 74.8730`.

## Local Data Requirements

- Restaurants must include Narowal addresses/local areas.
- Food menus must use PKR pricing and tags such as `biryani`, `fast-food`, `desi`, `pizza`, `burger`, `bakery`,
  and `family-restaurant`.
- Rider demo routes must include Narowal pickup/drop-off zones.
- Admin analytics and heatmaps should refer to Narowal zones instead of generic national regions.

## Demo Seed

Run `npm run seed:narowal` inside the `server` module to insert Narowal restaurants and menu items into MongoDB.
