import "dotenv/config";
import { Worker } from "bullmq";
import { handlers } from "./handlers";

/**
 * Main Worker Process
 *
 * Listens to a BullMQ queue and dispatches jobs to appropriate handlers
 * This is a single worker that can handle ANY job type by name
 *
 * To add new job types:
 * 1. Create a handler in src/handlers/
 * 2. Export it in src/handlers/index.ts
 * 3. Add it to the handlers map
 * Done! The worker will automatically handle it
 */

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

console.log(`[Worker] Starting... (Redis: ${REDIS_HOST}:${REDIS_PORT})`);

const worker = new Worker(
  "jobs",
  async (job) => {
    const handler = handlers[job.name];

    if (!handler) {
      throw new Error(
        `No handler found for job type: ${job.name}. Available: ${Object.keys(
          handlers
        ).join(", ")}`
      );
    }

    console.log(`[Worker] Processing job: ${job.name} (id: ${job.id})`);
    console.log(`[Worker] Job data:`, job.data);

    try {
      await handler(job.data);
      console.log(`[Worker] ✓ Job completed: ${job.name} (id: ${job.id})`);
    } catch (error) {
      console.error(`[Worker] ✗ Job failed: ${job.name} (id: ${job.id})`);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  }
);

// Event listeners
worker.on("completed", (job) => {
  console.log(`[Worker] Event: completed - ${job.name}`);
});

worker.on("failed", (job, error) => {
  console.error(`[Worker] Event: failed - ${job?.name}`, error?.message);
});

worker.on("error", (error) => {
  console.error(`[Worker] Event: error`, error);
});

console.log("[Worker] Listening for jobs...");
