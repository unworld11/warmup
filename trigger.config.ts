import { defineConfig } from '@trigger.dev/sdk';

// Your warmup Trigger.dev project. Override with TRIGGER_PROJECT_ID if needed.
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || 'proj_civprxkuxybbsqefqfon',
  dirs: ['./trigger'],
  maxDuration: 1200,
  retries: {
    enabledInDev: false,
    default: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2, randomize: true },
  },
});
