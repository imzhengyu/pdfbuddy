import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Serial execution, on purpose. Several parallel browser instances crash this
  // machine, which surfaces as "Target page, context or browser has been closed"
  // failures that look real but are not. See AGENTS.md -> Testing.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      // Uses the locally installed Microsoft Edge (Chromium) instead of a
      // Playwright-managed browser download. Google Chrome is not installed on
      // this machine; Edge is a supported Chromium channel and needs no download.
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        // This machine is old and short on memory: Edge was dying between tests
        // ("browser.newContext: Target page, context or browser has been
        // closed"). Keep the browser to a single renderer with a capped V8 heap
        // so a run of 20 tests does not exhaust RAM.
        launchOptions: {
          args: ['--renderer-process-limit=1', '--js-flags=--max-old-space-size=512']
        }
      }
    }
  ],
  webServer: {
    // Serve the production bundle rather than the dev server: on this machine
    // the dev server's module graph plus source maps is enough extra memory and
    // CPU to make Edge die mid-run ("browser.newContext: Target page, context
    // or browser has been closed"). A preview build is also closer to what
    // users actually get.
    command: 'npm run build && npm run preview -- --port 3000 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 240000
  }
});
