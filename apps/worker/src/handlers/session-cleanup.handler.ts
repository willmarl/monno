import { Job } from "bullmq";
import { cleanupExpiredSessions } from "../scripts/cleanup-expired-sessions";

/**
 * Handler for session cleanup jobs
 * Orchestrates the cleanup of expired sessions
 */
export async function sessionCleanupHandler(job: Job): Promise<void> {
  console.log(`[Session Cleanup] Starting cleanup job...`);

  try {
    // Run the cleanup script
    const result = await cleanupExpiredSessions();

    console.log(
      `[Session Cleanup] Successfully deleted ${
        result.deletedCount
      } expired sessions at ${result.timestamp.toISOString()}`
    );
  } catch (error) {
    console.error("[Session Cleanup] Error during cleanup:", error);
    throw error;
  }
}
