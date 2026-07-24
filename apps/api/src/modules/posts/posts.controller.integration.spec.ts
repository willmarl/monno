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

    it('returns 404 when the creator patches a soft-deleted post', async () => {
      const post = await testApp.prisma.post.create({
        data: {
          title: 'Soft Deleted',
          content: 'gone',
          creatorId: ownerUser.id,
          deleted: true,
          deletedAt: new Date(),
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Cookie', ownerCookies)
        .send({ title: 'Should Fail' });

      expect(res.status).toBe(404);

      await testApp.prisma.post.delete({ where: { id: post.id } });
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

    it('returns 410 when deleting an already soft-deleted post', async () => {
      const post = await testApp.prisma.post.create({
        data: {
          title: 'Already Gone',
          content: 'x',
          creatorId: ownerUser.id,
          deleted: true,
          deletedAt: new Date(),
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Cookie', ownerCookies);

      expect(res.status).toBe(410);

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

  // ── Visibility (PRIVATE posts) ────────────────────────────────────────────

  describe('Visibility', () => {
    let privatePostId: number;
    let publicPostId: number;

    beforeAll(async () => {
      const priv = await testApp.prisma.post.create({
        data: {
          title: `PrivateVis ${Date.now()}`,
          content: 'secret',
          creatorId: ownerUser.id,
          visibility: 'PRIVATE',
        },
      });
      privatePostId = priv.id;

      const pub = await testApp.prisma.post.create({
        data: {
          title: `PublicVis ${Date.now()}`,
          content: 'open',
          creatorId: ownerUser.id,
          visibility: 'PUBLIC',
        },
      });
      publicPostId = pub.id;
    });

    afterAll(async () => {
      await testApp.prisma.post.deleteMany({
        where: { id: { in: [privatePostId, publicPostId] } },
      });
    });

    it('returns 200 when the creator fetches their PRIVATE post', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get(`/posts/${privatePostId}`)
        .set('Cookie', ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(privatePostId);
      expect(res.body.data.visibility).toBe('PRIVATE');
    });

    it('returns 404 when a non-owner fetches a PRIVATE post', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get(`/posts/${privatePostId}`)
        .set('Cookie', otherCookies);

      expect(res.status).toBe(404);
    });

    it('returns 404 when a guest fetches a PRIVATE post', async () => {
      const res = await request(testApp.app.getHttpServer()).get(
        `/posts/${privatePostId}`,
      );

      expect(res.status).toBe(404);
    });

    it('excludes PRIVATE posts from public search even for the creator', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/posts')
        .query({ query: 'PrivateVis' })
        .set('Cookie', ownerCookies);

      expect(res.status).toBe(200);
      const ids = res.body.data.items.map((p: { id: number }) => p.id);
      expect(ids).not.toContain(privatePostId);
    });

    it('includes PUBLIC posts in public search', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/posts')
        .query({ query: 'PublicVis' });

      expect(res.status).toBe(200);
      const ids = res.body.data.items.map((p: { id: number }) => p.id);
      expect(ids).toContain(publicPostId);
    });

    it('owner profile list includes PRIVATE posts; other viewer does not', async () => {
      const asOwner = await request(testApp.app.getHttpServer())
        .get(`/posts/users/${ownerUser.id}`)
        .set('Cookie', ownerCookies);

      expect(asOwner.status).toBe(200);
      expect(
        asOwner.body.data.items.map((p: { id: number }) => p.id),
      ).toContain(privatePostId);

      const asOther = await request(testApp.app.getHttpServer())
        .get(`/posts/users/${ownerUser.id}`)
        .set('Cookie', otherCookies);

      expect(asOther.status).toBe(200);
      expect(
        asOther.body.data.items.map((p: { id: number }) => p.id),
      ).not.toContain(privatePostId);
    });

    it('liked list drops a post after it becomes PRIVATE for the liker', async () => {
      const post = await testApp.prisma.post.create({
        data: {
          title: `LikedThenPrivate ${Date.now()}`,
          content: 'x',
          creatorId: ownerUser.id,
          visibility: 'PUBLIC',
        },
      });

      await testApp.prisma.like.create({
        data: {
          userId: otherUser.id,
          resourceType: 'POST',
          resourceId: post.id,
        },
      });

      const before = await request(testApp.app.getHttpServer())
        .get(`/posts/users/${otherUser.id}/liked`)
        .set('Cookie', otherCookies);

      expect(before.status).toBe(200);
      expect(
        before.body.data.items.map((p: { id: number }) => p.id),
      ).toContain(post.id);

      await testApp.prisma.post.update({
        where: { id: post.id },
        data: { visibility: 'PRIVATE' },
      });

      const after = await request(testApp.app.getHttpServer())
        .get(`/posts/users/${otherUser.id}/liked`)
        .set('Cookie', otherCookies);

      expect(after.status).toBe(200);
      expect(
        after.body.data.items.map((p: { id: number }) => p.id),
      ).not.toContain(post.id);

      await testApp.prisma.like.deleteMany({
        where: { resourceType: 'POST', resourceId: post.id },
      });
      await testApp.prisma.post.delete({ where: { id: post.id } });
    });
  });
});
