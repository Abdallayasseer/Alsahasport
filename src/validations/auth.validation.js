const { z } = require("zod");

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const loginSchema = z.object({
  deviceId: z.string().optional(),
});

module.exports = {
  refreshSchema,
  loginSchema,
};
