import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, createTestUser, TestUser } from 'src/test-utils/auth-helper';

describe('PostsController (integration)', () => {
  let testApp: TestApp;
  let ownerUser: TestUser;
  let ownerCookies: string;
  let otherUser: TestUser;
  let otherCookies: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const owner = await createAndLogin(testApp.app, testApp.prisma, {
      username: `posts_owner_${Date.now()}`,
    });
    ownerUser = owner.user;
    ownerCookies = owner.cookieHeader;

    const other = await createAndLogin(testApp.app, testApp.prisma, {
      username: `posts_other_${Date.now()}`,
    });
    otherUser = other.user;
    otherCookies = other.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, ownerUser.id);
    await cleanupUser(testApp.prisma, otherUser.id);
    await testApp.app.close();
  });

  // ── POST /posts ───────────────────────────────────────────────────────────

  describe('POST /posts', () => {
    it('creates a post and returns 201', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/posts')
        .set('Cookie', ownerCookies)
        .send({ title: 'My Post', content: 'Some content' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('My Post');
      expect(res.body.data.creator.id).toBe(ownerUser.id);

      // Cleanup
      await testApp.prisma.post.delete({ where: { id: res.body.data.id } });
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/posts')
        .send({ title: 'My Post', content: 'Some content' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/posts')
        .set('Cookie', ownerCookies)
        .send({ content: 'Content without title' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /posts/:id ────────────────────────────────────────────────────────

  describe('GET /posts/:id', () => {
    let postId: number;

    beforeAll(async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'Test Post', content: 'Test content', creatorId: ownerUser.id },
      });
      postId = post.id;
    });

    afterAll(async () => {
      await testApp.prisma.post.deleteMany({ where: { id: postId } });
    });

    it('returns 200 with the post data', async () => {
      const res = await request(testApp.app.getHttpServer()).get(`/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(postId);
      expect(res.body.data.title).toBe('Test Post');
    });

    it('returns 404 for non-existent post', async () => {
      const res = await request(testApp.app.getHttpServer()).get('/posts/999999');

      expect(res.status).toBe(404);
    });

    it('returns 404 for a soft-deleted post', async () => {
      await testApp.prisma.post.update({
        where: { id: postId },
        data: { deleted: true, deletedAt: new Date() },
      });

      const res = await request(testApp.app.getHttpServer()).get(`/posts/${postId}`);
      expect(res.status).toBe(404);

      // Restore
      await testApp.prisma.post.update({
        where: { id: postId },
        data: { deleted: false, deletedAt: null },
      });
    });
  });

  // ── PATCH /posts/:id ──────────────────────────────────────────────────────

  describe('PATCH /posts/:id', () => {
    let postId: number;

    beforeAll(async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'Before Update', content: 'Old content', creatorId: ownerUser.id },
      });
      postId = post.id;
    });

    afterAll(async () => {
      await testApp.prisma.post.deleteMany({ where: { id: postId } });
    });

    it('allows the creator to update their post (200)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', ownerCookies)
        .send({ title: 'After Update' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('After Update');
    });

    it('returns 403 when a different user tries to update', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', otherCookies)
        .send({ title: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({ title: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /posts/:id ─────────────────────────────────────────────────────

  describe('DELETE /posts/:id', () => {
    it('allows the creator to soft-delete their post (204)', async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'To Delete', content: 'bye', creatorId: ownerUser.id },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', ownerCookies);

      expect(res.status).toBe(204);

      const dbPost = await testApp.prisma.post.findUnique({ where: { id: post.id } });
      expect(dbPost?.deleted).toBe(true);

      // Cleanup
      await testApp.prisma.post.delete({ where: { id: post.id } });
    });

    it('returns 403 when a different user tries to delete', async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'Protected', content: 'mine', creatorId: ownerUser.id },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', otherCookies);

      expect(res.status).toBe(403);

      // Cleanup
      await testApp.prisma.post.delete({ where: { id: post.id } });
    });

    it('returns 401 when unauthenticated', async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'Another', content: 'x', creatorId: ownerUser.id },
      });

      const res = await request(testApp.app.getHttpServer()).delete(`/posts/${post.id}`);
      expect(res.status).toBe(401);

      // Cleanup
      await testApp.prisma.post.delete({ where: { id: post.id } });
    });
  });

  // ── GET /posts (search) ───────────────────────────────────────────────────

  describe('GET /posts', () => {
    let postId: number;

    beforeAll(async () => {
      const post = await testApp.prisma.post.create({
        data: { title: 'Searchable Post', content: 'findme', creatorId: ownerUser.id },
      });
      postId = post.id;
    });

    afterAll(async () => {
      await testApp.prisma.post.deleteMany({ where: { id: postId } });
    });

    it('returns 200 with paginated post list', async () => {
      const res = await request(testApp.app.getHttpServer()).get('/posts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pageInfo).toBeDefined();
    });
  });
});
