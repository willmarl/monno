import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('ReportsController (integration)', () => {
  let testApp: TestApp;
  let reporter: TestUser;
  let reporterCookies: string;
  let owner: TestUser;
  let ownerCookies: string;
  let admin: TestUser;
  let adminCookies: string;
  let postId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const r = await createAndLogin(testApp.app, testApp.prisma, {
      username: `report_r_${Date.now()}`,
    });
    reporter = r.user;
    reporterCookies = r.cookieHeader;

    const o = await createAndLogin(testApp.app, testApp.prisma, {
      username: `report_o_${Date.now()}`,
    });
    owner = o.user;
    ownerCookies = o.cookieHeader;

    const a = await createAndLogin(testApp.app, testApp.prisma, {
      username: `report_a_${Date.now()}`,
      role: 'ADMIN',
    });
    admin = a.user;
    adminCookies = a.cookieHeader;

    const post = await testApp.prisma.post.create({
      data: {
        title: 'Reportable Post',
        content: 'content',
        creatorId: owner.id,
      },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, reporter.id);
    await cleanupUser(testApp.prisma, owner.id);
    await cleanupUser(testApp.prisma, admin.id);
    await testApp.app.close();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/reports')
      .send({
        resourceType: 'POST',
        resourceId: postId,
        reason: 'SPAM',
      });
    expect(res.status).toBe(401);
  });

  it('rejects reporting own content', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/reports')
      .set('Cookie', ownerCookies)
      .send({
        resourceType: 'POST',
        resourceId: postId,
        reason: 'SPAM',
      });
    expect(res.status).toBe(403);
  });

  it('creates a report and blocks duplicate open reports', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/reports')
      .set('Cookie', reporterCookies)
      .send({
        resourceType: 'POST',
        resourceId: postId,
        reason: 'SPAM',
        details: 'looks like spam',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.id).toBeTruthy();

    const dup = await request(testApp.app.getHttpServer())
      .post('/reports')
      .set('Cookie', reporterCookies)
      .send({
        resourceType: 'POST',
        resourceId: postId,
        reason: 'HARASSMENT',
      });
    expect(dup.status).toBe(409);
  });

  it('lists and updates reports as admin only', async () => {
    const forbidden = await request(testApp.app.getHttpServer())
      .get('/admin/reports')
      .set('Cookie', reporterCookies);
    expect(forbidden.status).toBe(403);

    const list = await request(testApp.app.getHttpServer())
      .get('/admin/reports')
      .query({ status: 'OPEN', resourceType: 'POST' })
      .set('Cookie', adminCookies);

    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
    const reportId = list.body.data.items[0].id;

    const updated = await request(testApp.app.getHttpServer())
      .patch(`/admin/reports/${reportId}`)
      .set('Cookie', adminCookies)
      .send({ status: 'RESOLVED', adminNotes: 'removed spam' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('RESOLVED');
    expect(updated.body.data.resolver.username).toBe(admin.username);
  });

  it('allows reporting a user from profile context', async () => {
    const self = await request(testApp.app.getHttpServer())
      .post('/reports')
      .set('Cookie', reporterCookies)
      .send({
        resourceType: 'USER',
        resourceId: reporter.id,
        reason: 'NSFW',
      });
    expect(self.status).toBe(403);

    const res = await request(testApp.app.getHttpServer())
      .post('/reports')
      .set('Cookie', reporterCookies)
      .send({
        resourceType: 'USER',
        resourceId: owner.id,
        reason: 'NSFW',
        details: 'bad avatar',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.resourceType).toBe('USER');

    const list = await request(testApp.app.getHttpServer())
      .get('/admin/reports')
      .query({ resourceType: 'USER', status: 'OPEN' })
      .set('Cookie', adminCookies);
    expect(list.status).toBe(200);
    expect(
      list.body.data.items.some(
        (item: { resourceId: number; targetUsername?: string }) =>
          item.resourceId === owner.id &&
          item.targetUsername === owner.username,
      ),
    ).toBe(true);
  });
});
