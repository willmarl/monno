import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('ViewsController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;
  let otherUser: TestUser;
  let otherCookies: string;
  let postAId: number;
  let postBId: number;
  let privateOtherPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `views_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;

    const other = await createAndLogin(testApp.app, testApp.prisma, {
      username: `views_other_${Date.now()}`,
    });
    otherUser = other.user;
    otherCookies = other.cookieHeader;

    const postA = await testApp.prisma.post.create({
      data: {
        title: 'History Post A',
        content: 'alpha content',
        creatorId: otherUser.id,
      },
    });
    postAId = postA.id;

    const postB = await testApp.prisma.post.create({
      data: {
        title: 'History Post B',
        content: 'beta content',
        creatorId: otherUser.id,
      },
    });
    postBId = postB.id;

    const privatePost = await testApp.prisma.post.create({
      data: {
        title: 'Private Other Post',
        content: 'secret',
        creatorId: otherUser.id,
        visibility: 'PRIVATE',
      },
    });
    privateOtherPostId = privatePost.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await cleanupUser(testApp.prisma, otherUser.id);
    await testApp.app.close();
  });

  describe('POST /views', () => {
    it('records history for authenticated user', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postAId });

      expect(res.status).toBe(201);
      expect(res.body.data.viewCount).toBeGreaterThanOrEqual(1);

      const row = await testApp.prisma.viewHistory.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: postAId,
          },
        },
      });
      expect(row).toBeTruthy();
      expect(row!.deleted).toBe(false);
    });

    it('upserts and bumps viewedAt on re-view', async () => {
      await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postBId });

      const first = await testApp.prisma.viewHistory.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: postAId,
          },
        },
      });

      await new Promise((r) => setTimeout(r, 20));

      const res = await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postAId });

      expect(res.status).toBe(201);

      const second = await testApp.prisma.viewHistory.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: postAId,
          },
        },
      });
      expect(second!.viewedAt.getTime()).toBeGreaterThan(
        first!.viewedAt.getTime(),
      );

      const history = await request(testApp.app.getHttpServer())
        .get('/views/history')
        .query({ resourceType: 'POST', limit: 10, offset: 0 })
        .set('Cookie', cookieHeader);

      expect(history.status).toBe(200);
      expect(history.body.data.items[0].id).toBe(postAId);
    });
  });

  describe('GET /views/history', () => {
    it('returns 401 without auth', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/views/history')
        .query({ resourceType: 'POST' });

      expect(res.status).toBe(401);
    });

    it('omits other users private posts from history list', async () => {
      await testApp.prisma.viewHistory.upsert({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: privateOtherPostId,
          },
        },
        create: {
          userId: testUser.id,
          resourceType: 'POST',
          resourceId: privateOtherPostId,
        },
        update: { deleted: false, deletedAt: null, viewedAt: new Date() },
      });

      const res = await request(testApp.app.getHttpServer())
        .get('/views/history')
        .query({ resourceType: 'POST', limit: 50, offset: 0 })
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      const ids = res.body.data.items.map((item: { id: number }) => item.id);
      expect(ids).not.toContain(privateOtherPostId);
    });
  });

  describe('DELETE /views/history/:id', () => {
    it('soft-deletes own entry and keeps row for audit', async () => {
      const row = await testApp.prisma.viewHistory.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: postBId,
          },
        },
      });
      expect(row).toBeTruthy();

      const res = await request(testApp.app.getHttpServer())
        .delete(`/views/history/${row!.id}`)
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const after = await testApp.prisma.viewHistory.findUnique({
        where: { id: row!.id },
      });
      expect(after!.deleted).toBe(true);
      expect(after!.deletedAt).toBeTruthy();

      const list = await request(testApp.app.getHttpServer())
        .get('/views/history')
        .query({ resourceType: 'POST', limit: 50, offset: 0 })
        .set('Cookie', cookieHeader);
      const ids = list.body.data.items.map((item: { id: number }) => item.id);
      expect(ids).not.toContain(postBId);
    });

    it('returns 404 when deleting another users entry', async () => {
      const otherRow = await testApp.prisma.viewHistory.create({
        data: {
          userId: otherUser.id,
          resourceType: 'POST',
          resourceId: postAId,
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/views/history/${otherRow.id}`)
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(404);

      const still = await testApp.prisma.viewHistory.findUnique({
        where: { id: otherRow.id },
      });
      expect(still!.deleted).toBe(false);
    });

    it('restores soft-deleted entry on re-view', async () => {
      const row = await testApp.prisma.viewHistory.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: postBId,
          },
        },
      });
      expect(row!.deleted).toBe(true);

      const res = await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postBId });

      expect(res.status).toBe(201);

      const restored = await testApp.prisma.viewHistory.findUnique({
        where: { id: row!.id },
      });
      expect(restored!.deleted).toBe(false);
      expect(restored!.deletedAt).toBeNull();
    });
  });

  describe('POST /views/history/clear', () => {
    it('soft-clears active history for resource type', async () => {
      await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postAId });
      await request(testApp.app.getHttpServer())
        .post('/views')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: postBId });

      const res = await request(testApp.app.getHttpServer())
        .post('/views/history/clear')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST' });

      expect(res.status).toBe(201);
      expect(res.body.data.cleared).toBeGreaterThanOrEqual(2);

      const active = await testApp.prisma.viewHistory.count({
        where: {
          userId: testUser.id,
          resourceType: 'POST',
          deleted: false,
        },
      });
      expect(active).toBe(0);

      const softDeleted = await testApp.prisma.viewHistory.count({
        where: {
          userId: testUser.id,
          resourceType: 'POST',
          deleted: true,
        },
      });
      expect(softDeleted).toBeGreaterThanOrEqual(2);
    });
  });
});
