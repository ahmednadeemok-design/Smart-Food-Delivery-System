require("dotenv").config();
const connectDB = require("../src/config/db");
const {
  archiveEligibleOrders,
  permanentlyCleanupDeletedOrders,
} = require("../src/utils/orderCleanupUtility");

const run = async () => {
  await connectDB();
  const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--confirm");
  const archivedCount = await archiveEligibleOrders();
  const cleanup = await permanentlyCleanupDeletedOrders({ dryRun });
  console.log(JSON.stringify({ archivedCount, cleanup }, null, 2));
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
