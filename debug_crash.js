const crypto = require("crypto");
require("dotenv").config();

// MOCK CONSTANTS
const ALGORITHM = "aes-256-gcm";
const secret = "test_secret_123";

// 1. Mock AdminService Methods
function generateRandomCode() {
  const suffix = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()
    .slice(0, 5);
  return `ALSAHA-${suffix}`;
}

// 2. Encryption Utils (Copied from encryption.js)
const getKey = () => {
  let key =
    process.env.DISPLAY_TOKEN_SECRET ||
    process.env.ACTIVATION_SECRET ||
    "fallback_secret";
  return crypto.createHash("sha256").update(key).digest();
};

const encryptCode = (text) => {
  try {
    const iv = crypto.randomBytes(12);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Encryption Failed:", err);
    throw err;
  }
};

// 3. Test Flow
try {
  console.log("Starting Debug Test...");

  // A. Internal Generation
  const codeRaw = generateRandomCode();
  console.log("Generated Code:", codeRaw);

  if (!codeRaw.startsWith("ALSAHA-")) {
    throw new Error("Prefix logic failed");
  }

  // B. Hashing Logic (from createCodeInDB)
  const codeHash = crypto
    .createHash("sha256")
    .update(secret + codeRaw)
    .digest("hex");
  console.log("Code Hash:", codeHash);

  // C. Encryption Logic
  const encrypted = encryptCode(codeRaw);
  console.log("Encrypted Code:", encrypted);

  console.log("SUCCESS: No crashes detected in logic flow.");
} catch (error) {
  console.error("CRASH DETECTED:", error);
  process.exit(1);
}
