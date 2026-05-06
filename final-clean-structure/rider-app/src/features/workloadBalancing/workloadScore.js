export function calculateWorkloadScore(activeOrders=0,maxOrders=3){return Math.min(100,Math.round((activeOrders/maxOrders)*100))}
