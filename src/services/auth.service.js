const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session.model");
const ActivationCode = require("../models/ActivationCode.model");
const Admin = require("../models/Admin.model");
const AppError = require("../utils/AppError");

// Temporarily importing tokenManager functions if they exist, or defining helper within service
// We will rely on existing utils if possible, but for "Complete Overhaul" we should perhaps own it or ensure it's solid.
// Im looking at the previous auth controller imports:
// const { hashToken, generateRefreshToken, signAccessToken } = require("../utils/tokenManager");

class AuthService {
  constructor() {
    this.hashToken = (token) =>
      crypto.createHash("sha256").update(token).digest("hex");
  }

  generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
  }

  signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });
  }

  async createSession(user, role, deviceId, ip, userAgent) {
    // 1. Enforce Single Session for Admins
    if (role !== "user") {
      await Session.updateMany(
        { userId: user._id, isRevoked: false },
        { isRevoked: true }
      );
    }

    // 2. Generate Tokens
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);

    // 3. Determine Session Life
    const sessionLife =
      role === "user"
        ? 14 * 24 * 60 * 60 * 1000 // 14 Days
        : 24 * 60 * 60 * 1000; // 24 Hours
    const expiresAt = new Date(Date.now() + sessionLife);

    // 4. Create Session Record
    const session = await Session.create({
      userId: user._id,
      userModel: role === "user" ? "ActivationCode" : "Admin",
      role,
      refreshTokenHash,
      deviceId: deviceId || "unknown",
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    // 5. Create Access Token
    const accessToken = this.signAccessToken({
      userId: user._id,
      sessionId: session._id,
      role,
    });

    return { session, accessToken, refreshToken, expiresAt };
  }

  async refreshToken(token) {
    if (!token) throw new AppError("No token provided", 401);

    const hashedToken = this.hashToken(token);

    const session = await Session.findOne({
      refreshTokenHash: hashedToken,
    }).select("+refreshTokenHash");

    if (!session) throw new AppError("Invalid Token", 401);

    if (session.isRevoked) throw new AppError("Session revoked", 401);
    if (session.expiresAt < Date.now())
      throw new AppError("Session expired", 401);

    // Validate User Existence
    let user;
    if (session.role === "user") {
      user = await ActivationCode.findById(session.userId);
    } else {
      user = await Admin.findById(session.userId);
    }

    if (!user) throw new AppError("User not found", 401);

    // Rotation
    const newRefreshToken = this.generateRefreshToken();
    const newHash = this.hashToken(newRefreshToken);

    session.refreshTokenHash = newHash;
    session.lastActive = Date.now();

    // Extend Session (Sliding Window)
    const sessionLife =
      session.role === "user" ? 14 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    session.expiresAt = new Date(Date.now() + sessionLife);

    await session.save();

    const newAccessToken = this.signAccessToken({
      userId: session.userId,
      sessionId: session._id,
      role: session.role,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      session,
      expiresAt: session.expiresAt,
    };
  }

  async revokeSession(sessionId) {
    if (!sessionId) return;
    await Session.findByIdAndUpdate(sessionId, { isRevoked: true });
  }

  async revokeAllSessions(userId) {
    await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }

  // Admin Login specific logic if needed, but 'completeLogin' in controller seems to handle it generically
  // Assuming Admin Login Controller verifies password then calls createSession
}

module.exports = new AuthService();
