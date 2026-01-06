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
    const messages = result.error.errors.map((e) => e.message).join(", ");
    return next(new AppError(messages, 400));
  }

  req.body = result.data;

  next();
};

module.exports = { validateLoginZod };
