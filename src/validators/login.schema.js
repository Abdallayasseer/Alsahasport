const { z } = require("zod");
const AppError = require("../utils/AppError");

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  clientPublicIp: z.string().optional(),
});

const validateLoginZod = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map((e) => e.message).join(", ");
      return next(new AppError(messages, 400));
    }
    next(err);
  }
};

module.exports = { validateLoginZod };
