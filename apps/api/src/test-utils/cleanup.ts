import { PrismaService } from '../prisma.service';

/**
 * Deletes a test user and all their data.
 *
 * Cascade deletes (happen automatically when user is deleted):
 *   Session, Like, Collection + CollectionItems, Comment, PasswordResetToken,
 *   EmailVerificationToken, UsernameHistory
 *
 * Must be deleted manually first (no cascade from User → Post):
 *   Post
 */
export async function cleanupUser(
  prisma: PrismaService,
  userId: number,
): Promise<void> {
  // Posts don't cascade from User — delete them first
  await prisma.post.deleteMany({ where: { creatorId: userId } });

  // Delete user — cascades everything else
  await prisma.user.delete({ where: { id: userId } }).catch(() => {
    // Ignore if user was already deleted (e.g., by a delete-account test)
  });
}

/**
 * Deletes all posts created by a user without deleting the user.
 * Useful when a test creates posts but needs to clean up mid-spec.
 */
export async function cleanupPosts(
  prisma: PrismaService,
  creatorId: number,
): Promise<void> {
  await prisma.post.deleteMany({ where: { creatorId } });
}
