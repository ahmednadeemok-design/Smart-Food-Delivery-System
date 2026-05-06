const generateOTP = require("../utils/generateOTP");

exports.createDeliveryOTP = () => generateOTP(6);

exports.verifyOTP = (savedOtp, enteredOtp) => String(savedOtp) === String(enteredOtp);
