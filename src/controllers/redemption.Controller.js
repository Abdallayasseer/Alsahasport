const mongoose = require("mongoose");
const ActivationCode = require("../models/ActivationCode.model");
const Session = require("../models/Session.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { hashToken } = require("../utils/tokenManager");

// @desc Atomic Code Redemption / Activation
exports.redeemCodeAtomic = catchAsync(async (req, res, next) => {
  const { code, deviceId } = req.body;

  if (!code || !deviceId) {
    return next(new AppError("Code and DeviceId required", 400));
  }

  // 1. Format Validation
  const codeTrimmed = code.trim().toUpperCase();
  const formatRegex = /^ALSAHA-[A-Z0-9]+$/;

  if (!formatRegex.test(codeTrimmed)) {
    return next(
      new AppError("Invalid Format. Code must start with 'ALSAHA-'", 400)
    );
  }

  const hashedCode = hashToken(codeTrimmed);

  // START TRANSACTION
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find Code (Read with lock if possible, or just strict atomic update query)
    // Note: For best "single use" guarantee, we rely on the atomic findOneAndUpdate
    // OR strict state checks inside transaction.

    const codeDoc = await ActivationCode.findOne({
      codeHash: hashedCode,
    })
      .select("+codeEncrypted")
      .session(session);

    if (!codeDoc) {
      throw new AppError("Invalid Code", 404);
    }

    if (codeDoc.status === "banned" || codeDoc.status === "expired") {
      throw new AppError("Code unavailable", 403);
    }

    // 2. Logic for "Unused" -> "Active"
    if (codeDoc.status === "unused") {
      codeDoc.status = "active";
      codeDoc.firstActivatedAt = Date.now();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + codeDoc.durationDays);
      codeDoc.expiresAt = expiry;

      await codeDoc.save({ session });
    } else {
      // Already Active: Check user-level expiry
      if (codeDoc.expiresAt < Date.now()) {
        codeDoc.status = "expired";
        await codeDoc.save({ session });
        throw new AppError("Code Expired", 403);
      }
    }

    // 3. Enforce Max Devices?
    // We can do this check outside transaction to avoid long locks,
    // or inside for strict correctness. Inside is safer.
    // NOTE: Session creation is dealing with a Different collection.
    // In Mongo 4.0+ transactions across collections are supported.

    // This is where we'd call the Session Logic (or return data to Controller to do it).
    // For this file, I'll return the 'User/Code' doc to the caller or handle session creation here.
    // Let's handle it here to keep it atomic.

    // Count Sessions
    // Note: 'Session' model is used here.
    const activeSessions = await Session.countDocuments({
      userId: codeDoc._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).session(session);

    const maxDevices = codeDoc.maxDevices || 1;

    if (activeSessions >= maxDevices) {
      // Check if THIS device is one of them?
      const existing = await Session.findOne({
        userId: codeDoc._id,
        deviceId: deviceId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!existing) {
        // New device, limit reached.
        // Policy: Fail, or Revoke Oldest?
        // Banking grade usually means: FAIL, tell user to logout elsewhere.
        throw new AppError(
          `Device limit reached (${maxDevices}). Deregister other devices first.`,
          409
        );
      }
      // If existing, we will just return success (rotation handled by auth controller typically)
    }

    await session.commitTransaction();
    session.endSession();

    // Return the doc for token generation
    req.redeemedUser = codeDoc; // Pass to next middleware or handle response
    next();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});
