const AdminService = require("../../src/services/admin.service");
const ActivationCode = require("../../src/models/ActivationCode.model");
const Admin = require("../../src/models/Admin.model");
const bcrypt = require("bcryptjs");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/models/ActivationCode.model");
jest.mock("../../src/models/Admin.model");
jest.mock("bcryptjs"); // Mock bcryptjs

describe("Admin Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should throw error if admin not found", async () => {
      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(AdminService.authenticate("test", "pass")).rejects.toThrow(
        "Invalid username or password"
      );
    });

    it("should throw error if password wrong", async () => {
      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ password: "hash" }),
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(AdminService.authenticate("test", "wrong")).rejects.toThrow(
        "Invalid username or password"
      );
    });

    it("should return admin if credentials valid", async () => {
      const mockAdmin = { _id: "123", username: "test", password: "hash" };
      Admin.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin),
      });
      bcrypt.compare.mockResolvedValue(true);

      const result = await AdminService.authenticate("test", "pass");
      expect(result).toBe(mockAdmin);
    });
  });
});
