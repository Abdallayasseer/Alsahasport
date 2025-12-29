const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("../src/app");
const Admin = require("../src/models/Admin.model");
const ActivationCode = require("../src/models/ActivationCode.model");
const Session = require("../src/models/Session.model");

jest.setTimeout(30000);

let adminToken;
let createdDisplayToken;

describe("Display Token Security Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean up
    await Admin.deleteMany({ username: "disp_admin" });
    await ActivationCode.deleteMany({});
    try {
      await mongoose.connection.collection("sessions").drop();
    } catch (e) {}

    // Create Admin
    await Admin.create({
      username: "disp_admin",
      password: "securepass",
      role: "MASTER_ADMIN",
    });

    // Log in to get session/token
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "disp_admin", password: "securepass" });

    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await Admin.deleteMany({ username: "disp_admin" });
    await ActivationCode.deleteMany({});
    await mongoose.connection.close();
  });

  test("Create Code -> Returns DisplayToken", async () => {
    const res = await request(app)
      .post("/api/admin/codes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ durationDays: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.displayToken).toBeDefined();
    expect(res.body.data.id).toBeDefined();

    createdDisplayToken = res.body.data.displayToken;
    createdId = res.body.data.id;
  });

  test("Display Code (GET) -> Works First Time", async () => {
    const res = await request(app)
      .get(`/api/admin/code/${createdId}/display?token=${createdDisplayToken}`)
      .set("Authorization", `Bearer ${adminToken}`);

    if (res.status !== 200) console.log("Display Fail:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBeDefined();
  });

  test("Display Code (GET) -> Fails Second Time (410)", async () => {
    const res = await request(app)
      .get(`/api/admin/code/${createdId}/display?token=${createdDisplayToken}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(410);
  });

  test("Display Code (GET) -> Fails Mismatched ID", async () => {
    // Use valid token but wrong ID
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/admin/code/${fakeId}/display?token=${createdDisplayToken}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400); // Token mismatch
  });
});
