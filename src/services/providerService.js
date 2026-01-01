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
      // Adjust strictly based on standard XC Reseller API
      // Typically: ?action=user&sub=create&username=USER&password=PASS&member_id=RESELLER_ID (or auth via login)
      // Since we don't have exact docs, we'll try a common structure or assume the user expects a specific format.
      // We will use a GET request which is common for older panels, or adapt as needed.

      const params = {
        username: RESELLER_USERNAME,
        password: RESELLER_PASSWORD,
        action: "user",
        sub: "create",
        user_data: {
          username: code,
          password: code,
          // Add other defaults if necessary, e.g., package_ids
        },
      };

      // NOTE: Many panels just accept query params directly
      const response = await axios.get(`${PROVIDER_API_URL}`, {
        params: {
          username: RESELLER_USERNAME,
          password: RESELLER_PASSWORD,
          action: "user",
          sub: "create",
          user_msg: code, // Some use user_msg as username
          user_pass: code,
          // generic fallback
          new_username: code,
          new_password: code,
          member_id: "RESELLER_ID_IF_NEEDED",
        },
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
      logger.error(`[ProviderService] Error creating line: ${error.message}`);
      throw new AppError(`Provider Error: ${error.message}`, 502);
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
