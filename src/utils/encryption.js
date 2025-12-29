const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
// Ensure we have a consistent key. In prod, use a specific env var.
// Fallback to ACTIVATION_SECRET or JWT_SECRET, padded to 32 bytes.
const getKey = () => {
  let key =
    process.env.DISPLAY_TOKEN_SECRET ||
    process.env.ACTIVATION_SECRET ||
    "fallback_secret";
  return crypto.createHash("sha256").update(key).digest(); // Returns 32 bytes
};

exports.encryptCode = (text) => {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  // Format: IV:AUTH_TAG:ENCRYPTED
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
};

exports.decryptCode = (pack) => {
  const [ivHex, tagHex, encryptedHex] = pack.split(":");
  if (!ivHex || !tagHex || !encryptedHex)
    throw new Error("Invalid Cipher Format");

  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
