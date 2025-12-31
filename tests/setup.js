const mongoose = require("mongoose");

beforeAll(async () => {
  // Use in-memory or dedicated test DB in real implementation
  // For now, we mock or just rely on environment
});

afterAll(async () => {
  await mongoose.connection.close();
});
