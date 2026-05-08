const friendlyValidationMessage = (error) => {
  if (!error) return "Validation failed";

  if (error.code === 11000) return "Email already exists.";

  if (error.name !== "ValidationError") return error.message || "Validation failed";

  const messages = Object.values(error.errors || {}).map((fieldError) => {
    if (fieldError.path === "password" && fieldError.kind === "minlength") {
      return "Password must be at least 6 characters.";
    }
    if (fieldError.path === "email") return "Please enter a valid email address.";
    if (fieldError.path === "name") return "Name is required.";
    if (fieldError.path === "phone") return "Phone number is required.";
    return fieldError.message;
  });

  return [...new Set(messages)].join(" ");
};

module.exports = { friendlyValidationMessage };
