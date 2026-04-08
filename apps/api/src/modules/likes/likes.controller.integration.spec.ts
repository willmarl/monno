import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('LikesController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;
  let testPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `likes_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;

    const post = await testApp.prisma.post.create({
      data: { title: 'Likeable Post', content: 'content', creatorId: testUser.id },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await testApp.app.close();
  });

  // ── POST /likes/toggle ────────────────────────────────────────────────────

  describe('POST /likes/toggle', () => {
    it('likes a post (returns 201)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(201);
      // Cleanup
      await testApp.prisma.like.deleteMany({
        where: { userId: testUser.id, resourceType: 'POST', resourceId: testPostId },
      });
    });

    it('unlike a post on second toggle (returns 201)', async () => {
      // Like first
      await testApp.prisma.like.create({
        data: { userId: testUser.id, resourceType: 'POST', resourceId: testPostId },
      });

      // Toggle again → unlike
      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(201);

      const like = await testApp.prisma.like.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: testPostId,
          },
        },
      });
      expect(like).toBeNull();
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(401);
    });

    it('returns 400 for an invalid resourceType', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'INVALID', resourceId: testPostId });

      expect(res.status).toBe(400);
    });

    it('returns 400 when resourceId is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST' });

      expect(res.status).toBe(400);
    });
  });
});
