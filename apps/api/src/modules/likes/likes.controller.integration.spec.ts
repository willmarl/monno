import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('LikesController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;
  let otherUser: TestUser;
  let otherCookies: string;
  let testPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `likes_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;

    const other = await createAndLogin(testApp.app, testApp.prisma, {
      username: `likes_other_${Date.now()}`,
    });
    otherUser = other.user;
    otherCookies = other.cookieHeader;

    const post = await testApp.prisma.post.create({
      data: {
        title: 'Likeable Post',
        content: 'content',
        creatorId: testUser.id,
      },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await cleanupUser(testApp.prisma, otherUser.id);
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
        where: {
          userId: testUser.id,
          resourceType: 'POST',
          resourceId: testPostId,
        },
      });
    });

    it('unlike a post on second toggle (returns 201)', async () => {
      // Like first
      await testApp.prisma.like.create({
        data: {
          userId: testUser.id,
          resourceType: 'POST',
          resourceId: testPostId,
        },
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

    it('allows the creator to like their own PRIVATE post', async () => {
      const privatePost = await testApp.prisma.post.create({
        data: {
          title: `PrivateLike ${Date.now()}`,
          content: 'x',
          creatorId: testUser.id,
          visibility: 'PRIVATE',
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: privatePost.id });

      expect(res.status).toBe(201);

      await testApp.prisma.like.deleteMany({
        where: { resourceType: 'POST', resourceId: privatePost.id },
      });
      await testApp.prisma.post.delete({ where: { id: privatePost.id } });
    });

    it('returns 404 when liking another users PRIVATE post', async () => {
      const privatePost = await testApp.prisma.post.create({
        data: {
          title: `OtherPrivateLike ${Date.now()}`,
          content: 'x',
          creatorId: testUser.id,
          visibility: 'PRIVATE',
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', otherCookies)
        .send({ resourceType: 'POST', resourceId: privatePost.id });

      expect(res.status).toBe(404);

      await testApp.prisma.post.delete({ where: { id: privatePost.id } });
    });

    it('likes a PUBLIC collection (returns 201)', async () => {
      const collection = await testApp.prisma.collection.create({
        data: {
          name: `LikeableCol ${Date.now()}`,
          creatorId: testUser.id,
          visibility: 'PUBLIC',
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', otherCookies)
        .send({ resourceType: 'COLLECTION', resourceId: collection.id });

      expect(res.status).toBe(201);
      expect(res.body.data.liked).toBe(true);

      await testApp.prisma.like.deleteMany({
        where: { resourceType: 'COLLECTION', resourceId: collection.id },
      });
      await testApp.prisma.collection.delete({ where: { id: collection.id } });
    });
  });
});
