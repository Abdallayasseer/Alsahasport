const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("../src/app");
const Admin = require("../src/models/Admin.model");
const Session = require("../src/models/Session.model");

// Long timeout
jest.setTimeout(30000);

describe("RBAC & Session Security Tests", () => {
  let adminId;
  let accessCookie;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      await mongoose.connection.collection("sessions").drop();
    } catch (e) {}

    await Admin.deleteMany({ username: "rbac_admin" });

    const admin = await Admin.create({
      username: "rbac_admin",
      password: "securepass",
      role: "MASTER_ADMIN",
    });
    adminId = admin._id;
  });

  afterAll(async () => {
    await Admin.deleteMany({ username: "rbac_admin" });
    await Session.deleteMany({});
    await mongoose.connection.close();
  });

  test("Admin Login -> Should Create Session & Return Cookies", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "rbac_admin", password: "securepass" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    // Check Cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=/);
    expect(cookies[0]).toMatch(/HttpOnly/);

    // Capture refresh token (roughly) if needed, but we rely on supertest agent usually or extract it
    accessCookie = cookies;

    // Verify Session in DB
    const session = await Session.findOne({ userId: adminId });
    expect(session).toBeTruthy();
    expect(session.role).toBe("MASTER_ADMIN");
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test("Single Session Limit -> Second Login Should Revoke First", async () => {
    // 1. First login (already did above, but let's do fresh)
    // Wait, above login created session A.

    // 2. Second login
    const res2 = await request(app)
      .post("/api/admin/login")
      .send({ username: "rbac_admin", password: "securepass" });

    expect(res2.status).toBe(200);

    // 3. Verify that we now have 1 active, 1 revoked (or just 1 active if we deleted)
    // Implementation said "updateMany isRevoked: true"
    const sessions = await Session.find({ userId: adminId });

    const active = sessions.filter((s) => !s.isRevoked);
    const revoked = sessions.filter((s) => s.isRevoked);

    expect(active.length).toBe(1);
    expect(revoked.length).toBeGreaterThanOrEqual(1);
  });

  // Test Token Refresh
  // Needs valid cookie.

  test("Token Refresh -> Should Rotate Token", async () => {
    // Login to get fresh cookie
    const agent = request.agent(app);
    await agent
      .post("/api/admin/login")
      .send({ username: "rbac_admin", password: "securepass" });

    // Get initial session
    const sessionBefore = await Session.findOne({
      userId: adminId,
      isRevoked: false,
    }).select("+refreshTokenHash");
    const oldHash = sessionBefore.refreshTokenHash;

    // Call Refresh
    const res = await agent.post("/api/auth/refresh");

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    // Verify Rotation
    const sessionAfter = await Session.findById(sessionBefore._id).select(
      "+refreshTokenHash"
    );
    expect(sessionAfter.refreshTokenHash).not.toBe(oldHash);
  });
});
