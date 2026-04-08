import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('CommentsController (integration)', () => {
  let testApp: TestApp;
  let author: TestUser;
  let authorCookies: string;
  let otherUser: TestUser;
  let otherCookies: string;
  let testPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const a = await createAndLogin(testApp.app, testApp.prisma, {
      username: `comments_author_${Date.now()}`,
    });
    author = a.user;
    authorCookies = a.cookieHeader;

    const o = await createAndLogin(testApp.app, testApp.prisma, {
      username: `comments_other_${Date.now()}`,
    });
    otherUser = o.user;
    otherCookies = o.cookieHeader;

    // Create a post to comment on
    const post = await testApp.prisma.post.create({
      data: { title: 'Comment Target', content: 'post content', creatorId: author.id },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    await testApp.prisma.post.delete({ where: { id: testPostId } });
    await cleanupUser(testApp.prisma, author.id);
    await cleanupUser(testApp.prisma, otherUser.id);
    await testApp.app.close();
  });

  // ── POST /comments ────────────────────────────────────────────────────────

  describe('POST /comments', () => {
    it('creates a comment on a post and returns 201', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/comments')
        .set('Cookie', authorCookies)
        .send({ resourceType: 'POST', resourceId: testPostId, content: 'Great post!' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Great post!');
      expect(res.body.data.creator.id).toBe(author.id);

      // Cleanup
      await testApp.prisma.comment.delete({ where: { id: res.body.data.id } });
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/comments')
        .send({ resourceType: 'POST', resourceId: testPostId, content: 'Hi' });

      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid resourceType', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/comments')
        .set('Cookie', authorCookies)
        .send({ resourceType: 'INVALID', resourceId: testPostId, content: 'Hi' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/comments')
        .set('Cookie', authorCookies)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(400);
    });

    it('returns 404 when commenting on a soft-deleted post', async () => {
      // Create and soft-delete a post
      const deletedPost = await testApp.prisma.post.create({
        data: { title: 'Deleted', content: 'x', creatorId: author.id, deleted: true },
      });

      const res = await request(testApp.app.getHttpServer())
        .post('/comments')
        .set('Cookie', authorCookies)
        .send({ resourceType: 'POST', resourceId: deletedPost.id, content: 'Hello?' });

      expect(res.status).toBe(404);

      await testApp.prisma.post.delete({ where: { id: deletedPost.id } });
    });
  });

  // ── PATCH /comments/:id ───────────────────────────────────────────────────

  describe('PATCH /comments/:id', () => {
    let commentId: number;

    beforeAll(async () => {
      const comment = await testApp.prisma.comment.create({
        data: {
          content: 'Original',
          resourceType: 'POST',
          resourceId: testPostId,
          userId: author.id,
        },
      });
      commentId = comment.id;
    });

    afterAll(async () => {
      await testApp.prisma.comment.deleteMany({ where: { id: commentId } });
    });

    it('allows the author to update their comment (200)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Cookie', authorCookies)
        .send({ content: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated');
    });

    it('returns 403 when another user tries to update', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Cookie', otherCookies)
        .send({ content: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .send({ content: 'No auth' });

      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /comments/:id ──────────────────────────────────────────────────

  describe('DELETE /comments/:id', () => {
    it('allows the author to delete their comment (204)', async () => {
      const comment = await testApp.prisma.comment.create({
        data: {
          content: 'To delete',
          resourceType: 'POST',
          resourceId: testPostId,
          userId: author.id,
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/comments/${comment.id}`)
        .set('Cookie', authorCookies);

      expect(res.status).toBe(204);

      const dbComment = await testApp.prisma.comment.findUnique({ where: { id: comment.id } });
      expect(dbComment?.deleted).toBe(true);

      // Cleanup
      await testApp.prisma.comment.delete({ where: { id: comment.id } });
    });

    it('returns 403 when another user tries to delete', async () => {
      const comment = await testApp.prisma.comment.create({
        data: {
          content: 'Mine',
          resourceType: 'POST',
          resourceId: testPostId,
          userId: author.id,
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/comments/${comment.id}`)
        .set('Cookie', otherCookies);

      expect(res.status).toBe(403);

      // Cleanup
      await testApp.prisma.comment.delete({ where: { id: comment.id } });
    });

    it('returns 401 when unauthenticated', async () => {
      const comment = await testApp.prisma.comment.create({
        data: {
          content: 'Protected',
          resourceType: 'POST',
          resourceId: testPostId,
          userId: author.id,
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/comments/${comment.id}`);

      expect(res.status).toBe(401);

      // Cleanup
      await testApp.prisma.comment.delete({ where: { id: comment.id } });
    });

    it('returns 410 when deleting an already soft-deleted comment', async () => {
      // Create and immediately soft-delete via DB
      const comment = await testApp.prisma.comment.create({
        data: {
          content: 'Already gone',
          resourceType: 'POST',
          resourceId: testPostId,
          userId: author.id,
          deleted: true,
        },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/comments/${comment.id}`)
        .set('Cookie', authorCookies);

      expect(res.status).toBe(410);

      await testApp.prisma.comment.delete({ where: { id: comment.id } });
    });
  });

  // ── GET /comments/resource/:resourceType/:resourceId ──────────────────────

  describe('GET /comments/resource/:resourceType/:resourceId', () => {
    it('returns 200 with comment list', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get(`/comments/resource/POST/${testPostId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
