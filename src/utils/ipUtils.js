const getRealIp = (req) => {
  let ip;

  // 1. Cloudflare (Highest Priority)
  if (req.headers["cf-connecting-ip"]) {
    ip = req.headers["cf-connecting-ip"];
  }

  // 2. X-Forwarded-For (Standard Proxy)
  else if (req.headers["x-forwarded-for"]) {
    // x-forwarded-for can be a list: "client, proxy1, proxy2"
    // We want the first one (client)
    ip = req.headers["x-forwarded-for"].split(",")[0].trim();
  }

  // 3. X-Real-IP (Nginx)
  else if (req.headers["x-real-ip"]) {
    ip = req.headers["x-real-ip"];
  }

  // 4. Fallback to req.ip (Express/Node default)
  else {
    ip = req.ip;
  }

  // 5. Fallback to socket remoteAddress (Low level)
  if (!ip && req.socket) {
    ip = req.socket.remoteAddress;
  }

  // 6. Clean up "::ffff:" compatible IPv6 prefix if present to get IPv4
  if (ip && typeof ip === "string" && ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // 7. Handle Localhost (::1) -> Return 127.0.0.1 for consistency
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip;
};

module.exports = { getRealIp };
