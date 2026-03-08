import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/demo.mjs --production --port 3100',
    url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 60000,
    env: { DEMO_MODE: 'true', DEMO_DATABASE_URL: '', SESSION_SECRET: 'isolated-browser-test-secret-at-least-32-characters', DEMO_DATA_DIR: '.demo-test-data/run-' + Date.now(), NEXT_TELEMETRY_DISABLED: '1' },
  },
})

