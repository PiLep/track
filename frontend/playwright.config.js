const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Global setup and teardown
  globalSetup: require.resolve('./test-utils/global-setup'),
  globalTeardown: require.resolve('./test-utils/global-teardown'),
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     port: 5173,
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});