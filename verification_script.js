const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = (msg, color = colors.reset) =>
  console.log(`${color}${msg}${colors.reset}`);

async function runTests() {
  log(`Starting Security Verification on ${BASE_URL}...\n`, colors.blue);

  // 1. Test 404 Handling
  try {
    const res = await fetch(`${BASE_URL}/random-route-that-does-not-exist`);
    const data = await res.json();
    if (res.status === 404 && data.status === "fail") {
      log("✓ Global 404 Handler Working", colors.green);
    } else {
      log(`✗ 404 Handler Failed. Status: ${res.status}`, colors.red);
    }
  } catch (err) {
    log(`✗ Connection Error: ${err.message}`, colors.red);
  }

  // 2. Test Input Validation (Auth)
  try {
    const res = await fetch(`${BASE_URL}/auth/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Missing code/deviceId
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes("provide code")) {
      log("✓ Input Validation (Missing Fields) Working", colors.green);
    } else {
      log(
        `✗ Input Validation Failed. Status: ${res.status}, Msg: ${data.message}`,
        colors.red
      );
    }
  } catch (err) {
    log(`✗ Test Failed: ${err.message}`, colors.red);
  }

  // 3. Test Protected Route (No Token)
  try {
    const res = await fetch(`${BASE_URL}/stream/channels`);
    const data = await res.json();
    if (res.status === 401) {
      log("✓ Route Protection (No Token) Working", colors.green);
    } else {
      log(`✗ Route Protection Failed. Status: ${res.status}`, colors.red);
    }
  } catch (err) {
    log(`✗ Test Failed: ${err.message}`, colors.red);
  }

  // 4. Test NoSQL Injection Sanitzation
  try {
    // Attempting to send an object as 'code' to trick query: { code: { $gt: "" } }
    const res = await fetch(`${BASE_URL}/auth/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: { $gt: "" },
        deviceId: "hacker-device",
      }),
    });

    // If sanitized, the '$gt' should be removed, leaving 'code' as empty object or field removed.
    // The controller checks if (!code), so if 'code' becomes empty object or removed, it triggers 400 or 404.
    // Ideally, mongoSanitize removes the '$gt' key.

    const data = await res.json();
    // We expect it to FAIL safely (400 or 404), not crash or succeed bypass.
    if (res.status >= 400 && res.status < 500) {
      log("✓ NoSQL Injection Payload Handled Safely", colors.green);
    } else {
      log(
        `✗ Potential NoSQL Injection Risk! Status: ${res.status}`,
        colors.red
      );
    }
  } catch (err) {
    log(`✗ Test Failed: ${err.message}`, colors.red);
  }

  log("\nVerification Complete.", colors.blue);
}

runTests();
