const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Please use a valid email"] },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    phone: { type: String, required: true },
    role: { type: String, enum: ["customer", "rider", "restaurant", "admin"], default: "customer" },
    avatar: { type: String, default: "" },
    address: { type: String, default: "" },
    location: { lat: Number, lng: Number },
    savedAddresses: [
      {
        label: { type: String, default: "Narowal address" },
        address: String,
        area: String,
        location: { lat: Number, lng: Number },
        isDefault: { type: Boolean, default: false },
      },
    ],
    loyalty: {
      points: { type: Number, default: 0 },
      redeemedPoints: { type: Number, default: 0 },
      badge: { type: String, enum: ["Bronze", "Silver", "Gold"], default: "Bronze" },
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    isBlocked: { type: Boolean, default: false },
    blockReason: String,
    subscription: { isActive: { type: Boolean, default: false }, expiryDate: Date },
    healthProfile: { caloriesGoal: Number, dietType: String, allergies: [String] },
    lastOrderAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is missing in server environment");
    error.statusCode = 500;
    throw error;
  }
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = mongoose.model("User", userSchema);
