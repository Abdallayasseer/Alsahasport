const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const ActivationCode = require("../src/models/ActivationCode.model");
const Admin = require("../src/models/Admin.model");
const connectDB = require("../src/config/db");

// Increase timeout for DB
jest.setTimeout(30000);

let adminToken;
let createdCodeId;

beforeAll(async () => {
  // Wait for DB connection
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }

  try {
    await mongoose.connection.collection("activationcodes").drop();
  } catch (e) {
    // Ignore if collection doesn't exist
  }

  // Create a temp admin
  await Admin.deleteMany({ username: "testadmin_sec" });
  await Admin.create({
    username: "testadmin_sec",
    password: "password123",
    role: "MASTER_ADMIN",
  });

  // Login to get token
  const res = await request(app)
    .post("/api/admin/login")
    .send({ username: "testadmin_sec", password: "password123" });

  if (res.body.status !== "success") {
    console.error("Login Failed:", res.body);
  }

  adminToken = res.body.accessToken;
});

afterAll(async () => {
  if (createdCodeId) {
    await ActivationCode.deleteMany({ _id: createdCodeId });
  }
  await Admin.deleteMany({ username: "testadmin_sec" });
});

describe("Security Exposure Tests", () => {
  test("POST /api/admin/codes - Should return raw code ONCE", async () => {
    const res = await request(app)
      .post("/api/admin/codes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ durationDays: 30, maxDevices: 1 });

    createdCodeId = res.body.data?.id;

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBeDefined(); // Raw code returned
    expect(res.body.data.code.length).toBeGreaterThan(5);
    expect(res.body.data.codeHash).toBeUndefined(); // Hash NOT returned

    // Verify DB State
    const doc = await ActivationCode.findById(createdCodeId).select(
      "+codeHash"
    );
    expect(doc.toObject().code).toBeUndefined();
    expect(doc.codeHash).toBeDefined();
    expect(doc.codeHash).not.toEqual(res.body.data.code);
  });

  test("GET /api/admin/codes - Should NOT return raw code or hash", async () => {
    const res = await request(app)
      .get("/api/admin/codes")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const codeEntry = res.body.data.find((c) => c._id === createdCodeId);
    expect(codeEntry).toBeDefined();

    // Security Checks
    expect(codeEntry.code).toBeUndefined();
    expect(codeEntry.codeHash).toBeUndefined();
    expect(codeEntry.salt).toBeUndefined();

    // Whitelisted fields should be present
    expect(codeEntry.durationDays).toBe(30);
  });

  test('Response Sanitizer - Should filter "password" from Login response', async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "testadmin_sec", password: "password123" });

    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.username).toBe("testadmin_sec");
  });
});
