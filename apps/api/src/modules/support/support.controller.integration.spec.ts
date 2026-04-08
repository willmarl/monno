import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

/**
 * SupportController only has a POST endpoint (create ticket).
 * The endpoint uses JwtAccessOptionalGuard — both authenticated and
 * anonymous users can submit tickets.
 *
 * Rate limit is 1 per minute per the controller. Since we set
 * THROTTLE_VERY_LENIENT_LIMIT=10000 in .env.test, this won't interfere.
 * The support controller uses a hardcoded { limit: 1, ttl: 60000 } though —
 * to avoid flakiness, tests use unique identifiers and run sequentially.
 */
describe('SupportController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `support_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;
  });

  afterAll(async () => {
    // Clean up any support tickets created by the test user
    await testApp.prisma.supportTicket
      .deleteMany({ where: { userId: testUser.id } })
      .catch(() => {}); // Ignore if SupportTicket model doesn't exist yet

    await cleanupUser(testApp.prisma, testUser.id);
    await testApp.app.close();
  });

  // ── POST /support ─────────────────────────────────────────────────────────

  describe('POST /support', () => {
    it('creates a ticket as an authenticated user (201)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/support')
        .set('Cookie', cookieHeader)
        .send({
          title: 'Test Subject',
          message: 'This is a test support message from an authenticated user.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('creates a ticket as an anonymous user (201)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/support')
        .send({
          title: 'Anonymous Subject',
          message: 'This is a test support message from an anonymous user.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/support')
        .send({ message: 'No title provided' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when message is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/support')
        .send({ title: 'Title without message' });

      expect(res.status).toBe(400);
    });
  });
});
