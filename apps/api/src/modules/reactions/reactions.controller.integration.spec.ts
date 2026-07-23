import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('ReactionsController (integration)', () => {
  let testApp: TestApp;
  let testUser: TestUser;
  let cookieHeader: string;
  let testPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const result = await createAndLogin(testApp.app, testApp.prisma, {
      username: `react_user_${Date.now()}`,
    });
    testUser = result.user;
    cookieHeader = result.cookieHeader;

    const post = await testApp.prisma.post.create({
      data: {
        title: 'Reactable Post',
        content: 'content',
        creatorId: testUser.id,
      },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, testUser.id);
    await testApp.app.close();
  });

  describe('POST /reactions/toggle', () => {
    it('adds an emoji reaction', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/reactions/toggle')
        .set('Cookie', cookieHeader)
        .send({
          resourceType: 'POST',
          resourceId: testPostId,
          emoji: '🔥',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reacted).toBe(true);
      expect(res.body.data.reactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            emoji: '🔥',
            count: 1,
            reactedByMe: true,
          }),
        ]),
      );
    });

    it('removes the same emoji on second toggle', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/reactions/toggle')
        .set('Cookie', cookieHeader)
        .send({
          resourceType: 'POST',
          resourceId: testPostId,
          emoji: '🔥',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reacted).toBe(false);
      expect(
        res.body.data.reactions.find((r: { emoji: string }) => r.emoji === '🔥'),
      ).toBeUndefined();
    });

    it('rejects non-emoji strings', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/reactions/toggle')
        .set('Cookie', cookieHeader)
        .send({
          resourceType: 'POST',
          resourceId: testPostId,
          emoji: 'not-an-emoji',
        });

      expect(res.status).toBe(400);
    });

    it('accepts any emoji outside the quick strip', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/reactions/toggle')
        .set('Cookie', cookieHeader)
        .send({
          resourceType: 'POST',
          resourceId: testPostId,
          emoji: '🚀',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reacted).toBe(true);
      expect(res.body.data.reactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ emoji: '🚀', reactedByMe: true }),
        ]),
      );
    });

    it('coexists with likes (like + reaction on same post)', async () => {
      await request(testApp.app.getHttpServer())
        .post('/likes/toggle')
        .set('Cookie', cookieHeader)
        .send({ resourceType: 'POST', resourceId: testPostId });

      const react = await request(testApp.app.getHttpServer())
        .post('/reactions/toggle')
        .set('Cookie', cookieHeader)
        .send({
          resourceType: 'POST',
          resourceId: testPostId,
          emoji: '👍',
        });

      expect(react.status).toBe(201);
      expect(react.body.data.reacted).toBe(true);

      const likeRow = await testApp.prisma.like.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: testPostId,
          },
        },
      });
      expect(likeRow).toBeTruthy();

      const reactionRow = await testApp.prisma.reaction.findUnique({
        where: {
          userId_resourceType_resourceId_emoji: {
            userId: testUser.id,
            resourceType: 'POST',
            resourceId: testPostId,
            emoji: '👍',
          },
        },
      });
      expect(reactionRow).toBeTruthy();
    });
  });
});
