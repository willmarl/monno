import { demoHandler } from "./demo.handler";

/**
 * Map of job names to their handler functions
 * Each handler orchestrates a pipeline of independent scripts
 * Add new handlers here as you add new job types
 */
export const handlers: Record<string, (data: any) => Promise<void>> = {
  demo: demoHandler,
  // Future handlers:
  // video: videoHandler,
  // document: documentHandler,
  // etc...
};
