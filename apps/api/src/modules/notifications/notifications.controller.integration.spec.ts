import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';
import { QueueService } from '../queue/queue.service';

describe('NotificationsController (integration)', () => {
  let testApp: TestApp;
  let owner: TestUser;
  let ownerCookies: string;
  let actor: TestUser;
  let actorCookies: string;
  let postId: number;
  let enqueueEmail: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    testApp = await createTestApp();

    enqueueEmail = vi.fn().mockResolvedValue(undefined);
    const queue = testApp.app.get(QueueService);
    vi.spyOn(queue, 'enqueueEmail').mockImplementation(enqueueEmail as any);

    const o = await createAndLogin(testApp.app, testApp.prisma, {
      username: `notif_o_${Date.now()}`,
    });
    owner = o.user;
    ownerCookies = o.cookieHeader;

    await testApp.prisma.user.update({
      where: { id: owner.id },
      data: {
        email: `notif_o_${Date.now()}@example.com`,
        isEmailVerified: true,
      },
    });

    const a = await createAndLogin(testApp.app, testApp.prisma, {
      username: `notif_a_${Date.now()}`,
    });
    actor = a.user;
    actorCookies = a.cookieHeader;

    const post = await testApp.prisma.post.create({
      data: {
        title: 'Notif Post',
        content: 'content',
        creatorId: owner.id,
      },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, owner.id);
    await cleanupUser(testApp.prisma, actor.id);
    await testApp.app.close();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(testApp.app.getHttpServer()).get(
      '/notifications',
    );
    expect(res.status).toBe(401);
  });

  it('creates a notification when someone comments on your post', async () => {
    enqueueEmail.mockClear();

    const commentRes = await request(testApp.app.getHttpServer())
      .post('/comments')
      .set('Cookie', actorCookies)
      .send({
        resourceType: 'POST',
        resourceId: postId,
        content: 'Nice post!',
      });
    expect(commentRes.status).toBe(201);

    const list = await request(testApp.app.getHttpServer())
      .get('/notifications')
      .set('Cookie', ownerCookies);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(list.body.data.items[0].type).toBe('COMMENT');
    expect(list.body.data.items[0].resourceType).toBe('POST');
    expect(list.body.data.items[0].resourceId).toBe(postId);
    expect(list.body.data.items[0].actor.id).toBe(actor.id);

    const actorList = await request(testApp.app.getHttpServer())
      .get('/notifications')
      .set('Cookie', actorCookies);
    expect(actorList.body.data.items).toEqual([]);

    expect(enqueueEmail).toHaveBeenCalled();
  });

  it('creates a notification on new like, not unlike', async () => {
    const before = await request(testApp.app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Cookie', ownerCookies);
    const beforeCount = before.body.data.count;

    const like = await request(testApp.app.getHttpServer())
      .post('/likes/toggle')
      .set('Cookie', actorCookies)
      .send({ resourceType: 'POST', resourceId: postId });
    expect(like.status).toBe(201);
    expect(like.body.data.liked).toBe(true);

    const afterLike = await request(testApp.app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Cookie', ownerCookies);
    expect(afterLike.body.data.count).toBeGreaterThan(beforeCount);

    const unlike = await request(testApp.app.getHttpServer())
      .post('/likes/toggle')
      .set('Cookie', actorCookies)
      .send({ resourceType: 'POST', resourceId: postId });
    expect(unlike.body.data.liked).toBe(false);

    const afterUnlike = await request(testApp.app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Cookie', ownerCookies);
    expect(afterUnlike.body.data.count).toBe(afterLike.body.data.count);
  });

  it('marks notifications as read', async () => {
    const list = await request(testApp.app.getHttpServer())
      .get('/notifications')
      .set('Cookie', ownerCookies);
    const unreadIds = list.body.data.items
      .filter((n: any) => !n.readAt)
      .map((n: any) => n.id);
    expect(unreadIds.length).toBeGreaterThan(0);

    const mark = await request(testApp.app.getHttpServer())
      .post('/notifications/read')
      .set('Cookie', ownerCookies)
      .send({ ids: [unreadIds[0]] });
    expect(mark.status).toBe(201);
    expect(mark.body.data.updated).toBe(1);

    const markAll = await request(testApp.app.getHttpServer())
      .post('/notifications/read')
      .set('Cookie', ownerCookies)
      .send({ all: true });
    expect(markAll.status).toBe(201);

    const count = await request(testApp.app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Cookie', ownerCookies);
    expect(count.body.data.count).toBe(0);
  });

  it('skips in-app when notifyInAppComments is false', async () => {
    await request(testApp.app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Cookie', ownerCookies)
      .send({
        notifyInAppComments: false,
        notifyEmailComments: false,
      });

    enqueueEmail.mockClear();

    const post2 = await testApp.prisma.post.create({
      data: {
        title: 'Notif Post 2',
        content: 'content',
        creatorId: owner.id,
      },
    });

    await request(testApp.app.getHttpServer())
      .post('/comments')
      .set('Cookie', actorCookies)
      .send({
        resourceType: 'POST',
        resourceId: post2.id,
        content: 'Should not notify',
      });

    const list = await request(testApp.app.getHttpServer())
      .get('/notifications?limit=50')
      .set('Cookie', ownerCookies);
    const commentOnPost2 = list.body.data.items.filter(
      (n: any) => n.resourceId === post2.id && n.type === 'COMMENT',
    );
    expect(commentOnPost2).toHaveLength(0);
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('skips types not on NOTIFIABLE_RESOURCES (e.g. USER)', async () => {
    const { NotificationsService } = await import('./notifications.service');
    const service = testApp.app.get(NotificationsService);
    const before = await testApp.prisma.notification.count({
      where: { recipientId: owner.id },
    });

    const result = await service.createIfAllowed({
      type: 'LIKE',
      actorId: actor.id,
      resourceType: 'USER',
      resourceId: owner.id,
    });

    expect(result).toBeNull();
    const after = await testApp.prisma.notification.count({
      where: { recipientId: owner.id },
    });
    expect(after).toBe(before);
  });
});
