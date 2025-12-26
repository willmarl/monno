import { demoHandler } from "./demo.handler";
import { sessionCleanupHandler } from "./session-cleanup.handler";
import { handleEmailJob } from "./email.handler";
/**
 * Map of job names to their handler functions
 * Each handler orchestrates a pipeline of independent scripts
 * Add new handlers here as you add new job types
 */
export const handlers: Record<string, (data: any) => Promise<void>> = {
  demo: demoHandler,
  "session-cleanup": sessionCleanupHandler,
  "send-email": handleEmailJob,
  // Future handlers:
  // video: videoHandler,
  // document: documentHandler,
  // etc...
};
