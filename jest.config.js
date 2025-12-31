module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/server.js"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
