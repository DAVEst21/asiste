const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    use: {
        baseURL: 'http://127.0.0.1:3100',
        viewport: { width: 1440, height: 1000 },
        locale: 'es-MX',
        timezoneId: 'America/Mexico_City',
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
            : {},
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'node scripts/start-demo.js',
        gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
        env: { DEMO_PORT: '3100' },
        url: 'http://127.0.0.1:3100/api/health',
        timeout: 180000,
        reuseExistingServer: false
    }
});
