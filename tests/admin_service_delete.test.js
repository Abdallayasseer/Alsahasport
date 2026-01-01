const AdminService = require("../src/services/admin.service");
const Admin = require("../src/models/Admin.model");
const ActivationCode = require("../src/models/ActivationCode.model");
const Session = require("../src/models/Session.model");
const bcrypt = require("bcryptjs");

// Mock dependencies
jest.mock("../src/models/Admin.model");
jest.mock("../src/models/ActivationCode.model");
jest.mock("../src/models/Session.model");
jest.mock("bcryptjs");

describe("AdminService.deleteCode", () => {
  const mockAdminId = "admin123";
  const mockCodeId = "code123";
  const mockApiPassword = "securePass";
  const mockHash = "hashedPass";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw 401 if password does not match", async () => {
    // Setup mocks
    Admin.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: mockAdminId,
        password: mockHash,
      }),
    });
    bcrypt.compare.mockResolvedValue(false); // Wrong password

    // Test
    await expect(
      AdminService.deleteCode(mockAdminId, mockCodeId, "wrongPass")
    ).rejects.toThrow("Incorrect password");

    expect(ActivationCode.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("should proceed if password matches", async () => {
    // Setup mocks
    Admin.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: mockAdminId,
        password: mockHash,
      }),
    });
    bcrypt.compare.mockResolvedValue(true); // Correct password
    ActivationCode.findByIdAndDelete.mockResolvedValue({ _id: mockCodeId });
    Session.findOneAndDelete.mockResolvedValue({});

    // Test
    const result = await AdminService.deleteCode(
      mockAdminId,
      mockCodeId,
      mockApiPassword
    );

    expect(result).toBe(true);
    expect(ActivationCode.findByIdAndDelete).toHaveBeenCalledWith(mockCodeId);
  });

  it("should throw 404 if admin not found", async () => {
    Admin.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      AdminService.deleteCode(mockAdminId, mockCodeId, mockApiPassword)
    ).rejects.toThrow("Admin not found"); // Or whatever generic error if not explicit
  });
});
