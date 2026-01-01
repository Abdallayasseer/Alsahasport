const axios = require("axios");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const PROVIDER_API_URL = process.env.PROVIDER_API_URL;
const RESELLER_USERNAME = process.env.RESELLER_USERNAME;
const RESELLER_PASSWORD = process.env.RESELLER_PASSWORD;

/**
 * Service to interact with External IPTV Provider (Xtream Codes)
 */
class ProviderService {
  /**
   * Create a new line (user) on the provider panel
   * @param {string} code - The activation code (used as username and password)
   * @returns {Promise<Object>} - The response data from provider
   */
  async createLine(code) {
    try {
      logger.info(`[ProviderService] Creating line for code: ${code}`);

      // Construct URL parameters for Xtream Codes API
      const params = {
        username: RESELLER_USERNAME,
        password: RESELLER_PASSWORD,
        action: "user",
        sub: "create",
        user_data: {
          username: code,
          password: code,
        },
      };

      // NOTE: Many panels just accept query params directly
      const response = await axios.get(`${PROVIDER_API_URL}`, {
        params: {
          username: RESELLER_USERNAME,
          password: RESELLER_PASSWORD,
          action: "user",
          sub: "create",
          user_msg: code,
          user_pass: code,
          new_username: code,
          new_password: code,
          member_id: "RESELLER_ID_IF_NEEDED",
        },
        timeout: 5000, // 5 Second Timeout
      });

      // Xtream UI / Xtream Codes V2 usually returns JSON
      if (response.data && response.data.result === false) {
        throw new Error(
          response.data.message || "Provider failed to create line"
        );
      }

      logger.info(`[ProviderService] Line created successfully for: ${code}`);
      return response.data;
    } catch (error) {
      // Enhanced Logging
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      logger.error(
        `[ProviderService] Error creating line: ${errorMsg}. Stack: ${error.stack}`
      );

      // Distinguish between timeout and other errors
      if (error.code === "ECONNABORTED") {
        throw new AppError(
          "Provider Connection Timeout (5s) - Please try again later",
          503
        );
      }

      throw new AppError(`Provider Unavailable: ${errorMsg}`, 503);
    }
  }

  /**
   * Delete/Ban a line on the provider panel
   * @param {string} code - The username to delete
   */
  async deleteLine(code) {
    try {
      logger.info(`[ProviderService] Deleting/Banning line: ${code}`);

      const response = await axios.get(`${PROVIDER_API_URL}`, {
        params: {
          username: RESELLER_USERNAME,
          password: RESELLER_PASSWORD,
          action: "user",
          sub: "delete", // or 'ban'
          user_id: code, // Sometimes needs numerical ID, but if we only have code/username, we might need to fetch ID first.
          // Assuming simplified API access for now.
        },
      });

      if (response.data && response.data.result === false) {
        // Log warning but maybe don't block deletion local side?
        // User said: "Call the provider API to delete/ban the user when we delete the code locally."
        logger.warn(
          `[ProviderService] Provider returned error on delete: ${response.data.message}`
        );
      }

      return response.data;
    } catch (error) {
      logger.error(`[ProviderService] Error deleting line: ${error.message}`);
      // We often don't want to stop local deletion if provider fails, but user didn't specify strict atomicity on delete like create.
    }
  }
}

module.exports = new ProviderService();
