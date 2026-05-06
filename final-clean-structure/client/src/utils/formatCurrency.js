export default function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}
