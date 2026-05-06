const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return errorResponse(res, "User already exists", 400);

    const user = await User.create({ name, email, password, phone, role });
    const token = user.getSignedJwtToken();

    return successResponse(res, "User registered successfully", {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getProfile = async (req, res) => {
  return successResponse(res, "Profile fetched successfully", req.user);
};
