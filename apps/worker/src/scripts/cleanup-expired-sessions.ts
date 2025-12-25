import { prisma } from "../prisma.service";

/**
 * Delete all expired sessions from the database
 * Runs as part of BullMQ cron job
 */
export async function cleanupExpiredSessions(): Promise<{
  deletedCount: number;
  timestamp: Date;
}> {
  try {
    const now = new Date();

    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now, // Less than (before) current time
        },
      },
    });

    return {
      deletedCount: result.count,
      timestamp: now,
    };
  } catch (error) {
    console.error("Error during session cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
