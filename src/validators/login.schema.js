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
    // The result.error object from safeParse is guaranteed to be a ZodError
    // when result.success is false, and ZodError always has an 'errors' array.
    // However, to align with the spirit of the instruction for defensive coding,
    // we can add a check, though it's technically not strictly necessary here
    // for Zod's safeParse output.
    const errors = result.error?.errors || [];
    const messages = errors.map((e) => e.message).join(", ") || "Validation failed";
    return next(new AppError(messages, 400));
  }

  req.body = result.data;

  next();
};

module.exports = { validateLoginZod };
