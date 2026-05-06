export function calculatePlatformStats({ users = 0, orders = 0, revenue = 0 }) {
  return {
    users,
    orders,
    revenue,
    avgRevenuePerOrder: orders ? Math.round(revenue / orders) : 0,
  };
}
