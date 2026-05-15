const User = require("../models/User");
const Rider = require("../models/Rider");
const crypto = require("crypto");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { isPakistaniPhone, isNarowalAddress, resolveNarowalArea, clampLocation } = require("../constants/narowal");
const { dbUnavailableResponse, isDbReady, logAuthError, normalizeAuthPhone } = require("../utils/authUtils");
const { friendlyValidationMessage } = require("../utils/validationMessages");
const { sendPasswordResetCode } = require("../utils/emailService");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  address: user.address,
  location: user.location,
  savedAddresses: user.savedAddresses || [],
  loyalty: user.loyalty,
  healthProfile: user.healthProfile,
  trustScore: user.trustScore,
  subscription: user.subscription,
  isBlocked: user.isBlocked,
});

const handleAuthError = (res, error) => {
  logAuthError("controller", error);
  const statusCode = error.statusCode || (error.name === "ValidationError" || error.code === 11000 ? 400 : 500);
  const message = error.name === "ValidationError" || error.code === 11000
    ? friendlyValidationMessage(error)
    : error.message || "Authentication failed";
  return errorResponse(res, message, statusCode);
};

exports.registerUser = async (req, res) => {
  try {
    if (!isDbReady()) return dbUnavailableResponse(res);

    const { name, password } = req.body;
    const phone = normalizeAuthPhone(req.body.phone);
    const email = req.body.email?.trim().toLowerCase();
    const requestedRole = String(req.body.role || "customer").trim().toLowerCase();
    const allowedSelfServiceRoles = ["customer", "rider", "restaurant"];

    if (!name || !email || !password || !phone) {
      return errorResponse(res, "Name, email, phone, and password are required", 400);
    }
    if (password.length < 6) return errorResponse(res, "Password must be at least 6 characters.", 400);
    if (![...allowedSelfServiceRoles, "admin"].includes(requestedRole)) return errorResponse(res, "Invalid registration role.", 400);
    if (requestedRole === "admin") {
      const expectedCode = process.env.ADMIN_REGISTRATION_CODE;
      if (!expectedCode || req.body.adminSetupCode !== expectedCode) {
        return errorResponse(res, "Admin registration is restricted.", 403);
      }
    }
    if (!isPakistaniPhone(phone)) return errorResponse(res, "Use Pakistani phone format +92XXXXXXXXXX", 400);
    if (req.body.address && !isNarowalAddress(req.body.address)) {
      return errorResponse(res, "Delivery address must be inside supported Narowal areas", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) return errorResponse(res, "Email already exists.", 400);

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: requestedRole,
      address: req.body.address || "",
      location: clampLocation(req.body.location),
      savedAddresses: req.body.address ? [{
        label: "Default",
        address: req.body.address,
        area: resolveNarowalArea(req.body.address),
        location: clampLocation(req.body.location),
        isDefault: true,
      }] : [],
    });

    if (user.role === "rider") {
      await Rider.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          vehicleType: req.body.vehicleType || "bike",
          cnic: req.body.cnic || "",
          bikeNumber: req.body.bikeNumber || "",
          drivingLicence: req.body.drivingLicence || "",
          paymentAccountType: req.body.paymentAccountType || "",
          paymentAccountNumber: req.body.paymentAccountNumber || "",
          profileImage: req.body.profileImage || "",
          phoneVerified: false,
          currentLocation: clampLocation(req.body.currentLocation || req.body.location),
          isOnline: false,
          isActive: true,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    const token = user.getSignedJwtToken();

    return successResponse(res, "User registered successfully", {
      token,
      user: publicUser(user),
    }, 201);
  } catch (error) {
    return handleAuthError(res, error);
  }
};

exports.loginUser = async (req, res) => {
  try {
    if (!isDbReady()) return dbUnavailableResponse(res);

    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !password) return errorResponse(res, "Please provide email and password", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user) return errorResponse(res, "Invalid email or password", 401);
    if (user.isBlocked) return errorResponse(res, user.blockReason || "User account is blocked", 403);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return errorResponse(res, "Invalid email or password", 401);

    const token = user.getSignedJwtToken();

    return successResponse(res, "Login successful", {
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
};

exports.getProfile = async (req, res) => {
  return successResponse(res, "Profile fetched successfully", publicUser(req.user));
};

exports.forgotPassword = async (req, res) => {
  try {
    if (!isDbReady()) return dbUnavailableResponse(res);

    const email = req.body.email?.trim().toLowerCase();
    if (!email) return errorResponse(res, "Email is required", 400);

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    if (user) {
      const token = String(crypto.randomInt(100000, 1000000));
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      await sendPasswordResetCode(user, token);
    }

    return successResponse(res, "If this email exists, a reset code has been sent.");
  } catch (error) {
    return handleAuthError(res, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!isDbReady()) return dbUnavailableResponse(res);

    const email = req.body.email?.trim().toLowerCase();
    const { token, password } = req.body;
    if (!email || !token || !password) return errorResponse(res, "Email, reset code, and new password are required", 400);
    if (password.length < 6) return errorResponse(res, "Password must be at least 6 characters.", 400);

    const user = await User.findOne({
      email,
      passwordResetToken: String(token).trim().toUpperCase(),
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");
    if (!user) return errorResponse(res, "Invalid or expired reset code. Please request a new one.", 400);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return successResponse(res, "Password reset successfully. You can now login.");
  } catch (error) {
    return handleAuthError(res, error);
  }
};
