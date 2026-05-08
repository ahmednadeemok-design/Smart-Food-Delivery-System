require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../src/models/User");
const Rider = require("../src/models/Rider");
const Restaurant = require("../src/models/Restaurant");
const FoodItem = require("../src/models/FoodItem");
const Order = require("../src/models/Order");
const Payment = require("../src/models/Payment");
const Complaint = require("../src/models/Complaint");
const Review = require("../src/models/Review");
const Subscription = require("../src/models/Subscription");
const TrustScore = require("../src/models/TrustScore");
const DeliveryVerification = require("../src/models/DeliveryVerification");
const AdminAuditLog = require("../src/models/AdminAuditLog");

const OPTIONAL_COLLECTIONS = ["carts", "sessions", "tokens"];

const deleteFromModel = async (label, model, filter = {}) => {
  const result = await model.deleteMany(filter);
  return [label, result.deletedCount || 0];
};

const deleteOptionalCollection = async (collectionName) => {
  const exists = await mongoose.connection.db
    .listCollections({ name: collectionName })
    .hasNext();

  if (!exists) return [collectionName, 0];

  const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
  return [collectionName, result.deletedCount || 0];
};

const printCounts = (counts) => {
  console.log("Reset completed. Deleted document counts:");
  Object.entries(counts).forEach(([label, count]) => {
    console.log(`- ${label}: ${count}`);
  });
};

const resetUsersAndData = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is missing in server environment");

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

  const counts = {};
  const addCount = ([label, count]) => {
    counts[label] = count;
  };

  addCount(await deleteFromModel("deliveryVerifications", DeliveryVerification));
  addCount(await deleteFromModel("payments", Payment));
  addCount(await deleteFromModel("complaints", Complaint));
  addCount(await deleteFromModel("reviews", Review));
  addCount(await deleteFromModel("subscriptions", Subscription));
  addCount(await deleteFromModel("trustScores", TrustScore));
  addCount(await deleteFromModel("adminAuditLogs", AdminAuditLog));
  addCount(await deleteFromModel("orders", Order));
  addCount(await deleteFromModel("foodItems", FoodItem));
  addCount(await deleteFromModel("restaurants", Restaurant));
  addCount(await deleteFromModel("riders", Rider));
  addCount(await deleteFromModel("users", User, { role: { $in: ["customer", "rider", "restaurant", "admin"] } }));

  for (const collectionName of OPTIONAL_COLLECTIONS) {
    addCount(await deleteOptionalCollection(collectionName));
  }

  printCounts(counts);
};

resetUsersAndData()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Reset failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
