const { loadEnv } = require("@medusajs/framework/utils")
loadEnv("test", process.cwd())
module.exports = {
  transform: { "^.+\\.[jt]s$": ["@swc/jest", { jsc: { parser: { syntax: "typescript", decorators: true }, target: "es2021" } }] },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
  ...(process.env.TEST_TYPE === "integration:modules" && { testMatch: ["**/integration-tests/modules/*.spec.ts"] }),
  ...(process.env.TEST_TYPE === "unit" && { testMatch: ["**/tests/unit/*.unit.spec.ts"] }),
}
