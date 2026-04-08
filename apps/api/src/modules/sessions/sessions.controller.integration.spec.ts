import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('SessionsController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `sessions_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await testApp.app.close();
  });

  // ── GET /sessions ─────────────────────────────────────────────────────────

  describe('GET /sessions', () => {
    it('returns 200 with an array of sessions', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/sessions')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('includes the current session in the list', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/sessions')
        .set('Cookie', cookieHeader);

      // The login in beforeAll created at least one session
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('userAgent');
      expect(res.body.data[0]).toHaveProperty('isValid', true);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer()).get('/sessions');
      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /sessions/:id ──────────────────────────────────────────────────

  describe('DELETE /sessions/:id', () => {
    it('revokes a session owned by the user (204)', async () => {
      // Create a second user and log in so we have a session to revoke
      const secondLogin = await createAndLogin(testApp.app, testApp.prisma, {
        username: `sessions_second_${Date.now()}`,
      });

      const sessions = await testApp.prisma.session.findMany({
        where: { userId: secondLogin.user.id, isValid: true },
      });
      const sessionId = sessions[0]?.id;

      if (sessionId) {
        const res = await request(testApp.app.getHttpServer())
          .delete(`/sessions/${sessionId}`)
          .set('Cookie', secondLogin.cookieHeader);

        expect(res.status).toBe(204);

        const updatedSession = await testApp.prisma.session.findUnique({
          where: { id: sessionId },
        });
        expect(updatedSession?.isValid).toBe(false);
      }

      await cleanupUser(testApp.prisma, secondLogin.user.id);
    });

    it('returns 403 when trying to revoke another user\'s session', async () => {
      const sessions = await testApp.prisma.session.findMany({
        where: { userId: testUser.id, isValid: true },
      });
      const sessionId = sessions[0]?.id;

      if (sessionId) {
        // Create another user and try to revoke testUser's session
        const intruder = await createAndLogin(testApp.app, testApp.prisma, {
          username: `sessions_intruder_${Date.now()}`,
        });

        const res = await request(testApp.app.getHttpServer())
          .delete(`/sessions/${sessionId}`)
          .set('Cookie', intruder.cookieHeader);

        expect(res.status).toBe(403);

        await cleanupUser(testApp.prisma, intruder.user.id);
      }
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .delete('/sessions/some-uuid');

      expect(res.status).toBe(401);
    });
  });

  // ── Revoked session cookie is rejected ────────────────────────────────────

  describe('using a revoked session', () => {
    it('returns 401 when the session cookie has been revoked', async () => {
      // Create a fresh user and log in
      const { user, cookieHeader: freshCookies, sessionId } = await createAndLogin(
        testApp.app,
        testApp.prisma,
        { username: `s_rev_${Date.now()}` },
      );

      expect(sessionId).toBeDefined();

      // Revoke the session directly in the DB
      await testApp.prisma.session.update({
        where: { id: sessionId! },
        data: { isValid: false },
      });

      // Attempt an authenticated request with the now-invalid cookies
      const res = await request(testApp.app.getHttpServer())
        .get('/sessions')
        .set('Cookie', freshCookies);

      expect(res.status).toBe(401);

      await cleanupUser(testApp.prisma, user.id);
    });
  });
});
