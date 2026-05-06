exports.sendSMS = async ({ to, message }) => {
  console.log(`SMS mock sent to ${to}: ${message}`);
  return { success: true };
};
