const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  trustScore: user.trustScore,
  subscription: user.subscription,
});

const handleAuthError = (res, error) => {
  const statusCode = error.name === "ValidationError" || error.code === 11000 ? 400 : 500;
  const message = error.code === 11000 ? "User already exists" : error.message;
  return errorResponse(res, message, statusCode);
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
      return errorResponse(res, "Name, email, phone, and password are required", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) return errorResponse(res, "User already exists", 400);

    const user = await User.create({ name, email, password, phone, role });
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
    const { email, password } = req.body;

    if (!email || !password) return errorResponse(res, "Please provide email and password", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user) return errorResponse(res, "Invalid credentials", 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

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
