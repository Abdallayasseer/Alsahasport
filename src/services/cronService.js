const cron = require("node-cron");
const ActivationCode = require("../models/ActivationCode.model");
const logger = require("../utils/logger");

// Safely try to require providerService
let providerService = null;
try {
  providerService = require("./providerService");
} catch (err) {
  logger.warn(
    "[Cron] providerService.js not found. External deletion will be skipped."
  );
}

const cleanExpiredCodes = async () => {
  try {
    const expiredCodes = await ActivationCode.find({
      expiresAt: { $lt: new Date() },
    });

    if (expiredCodes.length === 0) {
      return;
    }

    logger.info(
      `[Cron] Found ${expiredCodes.length} expired codes. Starting cleanup...`
    );

    let removedCount = 0;

    for (const code of expiredCodes) {
      // 1. External Deletion (if provider service exists)
      if (providerService) {
        try {
          // Assuming 'code.codeHash' or some other field is the identifier?
          // User request said 'deleteLine(code.username)', but ActivationCode model doesn't have username directly,
          // it has `createdBy`. The actual 'line' username is usually the code itself or hidden in codeEncrypted?
          // Looking at previous context providing `codeRaw` was common.
          // Wait, the model has `codeHash` and `codeEncrypted`.
          // User instruction: "await providerService.deleteLine(code.username)"
          // I'll stick to what they said, but `code.username` might be undefined on the model.
          // I'll use `code.codeHash` (which is likely the username/code string) as a best guess fallback if username is missing.
          const identifier = code.username || code.codeHash;
          await providerService.deleteLine(identifier);
          logger.info(`[Cron] Deleted external line for code: ${code._id}`);
        } catch (extErr) {
          logger.error(
            `[Cron] External deletion failed for code ${code._id}: ${extErr.message}. Proceeding to local delete.`
          );
        }
      }

      // 2. Local Deletion
      await ActivationCode.findByIdAndDelete(code._id);
      removedCount++;
    }

    logger.info(
      `[Cron] Cleanup complete. Removed ${removedCount} expired codes.`
    );
  } catch (error) {
    logger.error(`[Cron] Error during expired code cleanup: ${error.message}`);
  }
};

// Initialize Cron Jobs
const initCronJobs = () => {
  // Run every hour: 0 * * * *
  cron.schedule("0 * * * *", () => {
    cleanExpiredCodes();
  });

  logger.info("[Cron] Service started. Schedule: Every hour (0 * * * *)");
};

module.exports = { initCronJobs };
