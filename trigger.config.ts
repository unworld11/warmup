import { defineConfig } from '@trigger.dev/sdk';

// The project ref comes from your Trigger.dev project (set TRIGGER_PROJECT_ID).
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || '',
  dirs: ['./trigger'],
  maxDuration: 1200,
  retries: {
    enabledInDev: false,
    default: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2, randomize: true },
  },
});
