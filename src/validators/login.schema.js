const { z } = require("zod");
const AppError = require("../utils/AppError");

const loginSchema = z.object({
  loginId: z.string().min(1, "Username or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  clientPublicIp: z.string().optional(),
});

const validateLoginZod = (req, res, next) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    // Debugging: Log the full error object to understand why errors might be missing
    console.log(
      "LOGIN VALIDATION FAILED:",
      JSON.stringify(result.error, null, 2)
    );

    const errors = result.error?.errors || [];
    const messages =
      errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") ||
      "Validation failed";
    return next(new AppError(messages, 400));
  }

  req.body = result.data;

  next();
};

module.exports = { validateLoginZod };
