const mongoose = require("mongoose");

let retryTimer = null;
let isConnecting = false;

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return mongoose.connection;
  isConnecting = true;

  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) throw new Error("MONGO_URI is missing in .env file");

    mongoose.set("bufferCommands", false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error("Server will keep running and return 503 for database-backed routes until MongoDB is available.");
    if (!retryTimer) {
      retryTimer = setInterval(() => {
        connectDB().catch(() => {});
      }, 10000);
      retryTimer.unref?.();
    }
    return null;
  } finally {
    isConnecting = false;
  }
};

mongoose.connection.on("disconnected", () => {
  if (!retryTimer) {
    retryTimer = setInterval(() => {
      connectDB().catch(() => {});
    }, 10000);
    retryTimer.unref?.();
  }
});

module.exports = connectDB;
