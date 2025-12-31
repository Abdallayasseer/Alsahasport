const axios = require("axios");

async function runTest() {
  const baseURL = "http://localhost:5000/api";
  let adminToken;
  let codeId;

  try {
    console.log("1. Logging in as Master Admin...");
    const loginRes = await axios.post(`${baseURL}/admin/login`, {
      username: "admin",
      password: "password123",
    });

    // Assuming cookie or token is returned. The implementation creates a session but we need to see how client auths.
    // It seems it uses httpOnly cookie.
    // For CLI test we might need to parse headers.
    // BUT wait, looking at `authController.js` and `admin.Controller.js` (createSessionAndSend), it likely sets cookies.
    // Axios doesn't persist cookies automatically. We need to handle cookie jar.
    console.log("Login Success.");
    const cookies = loginRes.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    const axiosInstance = axios.create({
      baseURL,
      headers: { Cookie: cookieHeader },
    });

    console.log("2. Creating a dummy code to delete...");
    const createRes = await axiosInstance.post(`${baseURL}/admin/codes`, {
      durationDays: 1,
      maxDevices: 1,
    });
    codeId = createRes.data.data.id;
    console.log(`Created code with ID: ${codeId}`);

    console.log("3. Attempting to delete with INCORRECT password...");
    try {
      await axiosInstance.delete(`${baseURL}/admin/codes/${codeId}`, {
        data: { password: "WRONG_PASSWORD" },
      });
      console.error("FAIL: Deletion SUCCEEDED with incorrect password!");
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 400)
      ) {
        console.log(
          `PASS: Deletion failed as expected with status ${err.response.status}`
        );
      } else {
        console.error(
          `FAIL: Deletion failed but with unexpected status: ${
            err.response ? err.response.status : err.message
          }`
        );
        console.error(err.response?.data);
      }
    }

    console.log("4. Attempting to delete with CORRECT password...");
    try {
      await axiosInstance.delete(`${baseURL}/admin/codes/${codeId}`, {
        data: { password: "password123" },
      });
      console.log("PASS: Deletion succeeded with correct password.");
    } catch (err) {
      console.error("FAIL: Deletion failed even with correct password!");
      console.error(err.response?.data);
    }
  } catch (error) {
    console.error("Test Setup Failed:", error.message);
    console.error(error.response?.data);
  }
}

runTest();
