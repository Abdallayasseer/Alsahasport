const isPrivateOrCgnat = (ip) => {
  if (!ip) return false;

  // Localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip.includes("localhost"))
    return true;

  // Private Rangs
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    if (parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) return true;
  }

  // CGNAT (100.64.0.0/10)
  // 100.64.0.0 – 100.127.255.255
  if (ip.startsWith("100.")) {
    const parts = ip.split(".");
    if (parseInt(parts[1]) >= 64 && parseInt(parts[1]) <= 127) return true;
  }

  return false;
};

const analyzeIpConfidence = (clientPublicIp, proxyDetectedIp) => {
  let ipConfidence = "LOW";
  let bestIp = proxyDetectedIp;

  const isClientIpValid = clientPublicIp && !isPrivateOrCgnat(clientPublicIp);
  const isProxyIpValid = proxyDetectedIp && !isPrivateOrCgnat(proxyDetectedIp);

  if (isClientIpValid) {
    // High confidence: Client provided a public IP
    ipConfidence = "HIGH";
    bestIp = clientPublicIp; // Prefer public IP for display if available and valid
  } else if (isProxyIpValid) {
    // Medium confidence: Client didn't provide valid IP, but proxy sees a public IP
    ipConfidence = "MEDIUM";
    bestIp = proxyDetectedIp;
  } else {
    // Low confidence: Both are private/CGNAT or missing
    ipConfidence = "LOW";
    bestIp = proxyDetectedIp || "Unknown";
  }

  // Strict Rule: Never trust client IP blindly for security / rate limiting
  // But for the "Session" record which is informational, we can store what we found.

  return { ipConfidence, clientPublicIp, proxyDetectedIp, bestIp };
};

module.exports = { analyzeIpConfidence, isPrivateOrCgnat };
