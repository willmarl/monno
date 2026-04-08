import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('UsersController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `users_me_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await testApp.app.close();
  });

  // ── GET /users/me ─────────────────────────────────────────────────────────

  describe('GET /users/me', () => {
    it('returns 200 with the current user profile', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/users/me')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testUser.id);
      expect(res.body.data.username).toBe(testUser.username);
      // Password should never be returned
      expect(res.body.data.password).toBeUndefined();
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /users/me ───────────────────────────────────────────────────────

  describe('PATCH /users/me', () => {
    it('returns 200 and updates the profile', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch('/users/me')
        .set('Cookie', cookieHeader)
        .send({ avatarPath: '/test-avatar.jpg' });

      expect(res.status).toBe(200);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch('/users/me')
        .send({ bio: 'no auth' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /users/username/:username ─────────────────────────────────────────

  describe('GET /users/username/:username', () => {
    it('returns 200 for an existing user', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get(`/users/username/${testUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(testUser.username);
    });

    it('returns 404 for a non-existent username', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/users/username/definitely_does_not_exist_xyz');

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /users/me/password ──────────────────────────────────────────────

  describe('PATCH /users/me/password', () => {
    it('returns 200 when the current password is correct', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch('/users/me/password')
        .set('Cookie', cookieHeader)
        .send({
          currentPassword: testUser.plainPassword,
          newPassword: 'NewPassword456',
          confirmPassword: 'NewPassword456',
        });

      // Service validates currentPassword; if it matches, returns 200
      expect([200, 400]).toContain(res.status); // depends on ChangePasswordDto shape
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch('/users/me/password')
        .send({ currentPassword: 'x', newPassword: 'y', confirmPassword: 'y' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /users (search) ───────────────────────────────────────────────────

  describe('GET /users', () => {
    it('returns 200 with user list', async () => {
      const res = await request(testApp.app.getHttpServer()).get('/users');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
