import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base, testDir: './homolog', fullyParallel: false, workers: 1, retries: 0,
  timeout: 90_000, reporter: 'line',
  use: { ...base.use, baseURL: process.env.BASE_URL || 'http://127.0.0.1:18080', trace: 'off', video: 'off' },
});
