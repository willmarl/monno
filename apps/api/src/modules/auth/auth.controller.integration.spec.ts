import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createTestUser, TestUser } from 'src/test-utils/auth-helper';

describe('AuthController (integration)', () => {
  let testApp: TestApp;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await cleanupUser(testApp.prisma, id);
    }
    await testApp.app.close();
  });

  // ── POST /auth/register ───────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('registers a new user and returns 201 with cookies', async () => {
      const username = `reg_${Date.now()}`;

      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ username, password: 'Password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Cookies should be set
      const cookies = res.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);

      // Track for cleanup
      const user = await testApp.prisma.user.findUnique({ where: { username } });
      if (user) createdUserIds.push(user.id);
    });

    it('returns 409 when username is already taken', async () => {
      const user = await createTestUser(testApp.prisma, { username: `dup_${Date.now()}` });
      createdUserIds.push(user.id);

      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ username: user.username, password: 'Password123' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when username is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'Password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'validuser' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for username shorter than 2 characters', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'a', password: 'Password123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for username with invalid characters', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'user name!', password: 'Password123' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = await createTestUser(testApp.prisma, {
        username: `login_${Date.now()}`,
        password: 'CorrectPassword1',
      });
      createdUserIds.push(testUser.id);
    });

    it('returns 201 with cookies for valid credentials', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: testUser.plainPassword });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'] as string[];
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: testUser.username, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for non-existent username', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'doesnotexist_xyz', password: 'AnyPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for a suspended account', async () => {
      const suspendedUser = await createTestUser(testApp.prisma, {
        username: `suspended_${Date.now()}`,
        password: 'Password123',
        status: 'SUSPENDED',
      });
      createdUserIds.push(suspendedUser.id);

      const res = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: suspendedUser.username, password: suspendedUser.plainPassword });

      expect(res.status).toBe(401);
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/logout ─────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('returns 201 when authenticated', async () => {
      const user = await createTestUser(testApp.prisma, { username: `logout_${Date.now()}` });
      createdUserIds.push(user.id);

      // Login first
      const loginRes = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: user.username, password: user.plainPassword });

      const cookies = (loginRes.headers['set-cookie'] as string[])
        .map((c: string) => c.split(';')[0])
        .join('; ');

      const res = await request(testApp.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  // ── POST /auth/refresh ────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('returns 201 with new tokens when refresh cookie is valid', async () => {
      const user = await createTestUser(testApp.prisma, { username: `refresh_${Date.now()}` });
      createdUserIds.push(user.id);

      const loginRes = await request(testApp.app.getHttpServer())
        .post('/auth/login')
        .send({ username: user.username, password: user.plainPassword });

      const cookies = (loginRes.headers['set-cookie'] as string[])
        .map((c: string) => c.split(';')[0])
        .join('; ');

      const res = await request(testApp.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const newCookies = res.headers['set-cookie'] as string[];
      expect(newCookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
    });

    it('returns 401 when no refresh cookie is present', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/auth/refresh');

      expect(res.status).toBe(401);
    });
  });
});
