import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('Admin bulk soft-delete (integration)', () => {
  let testApp: TestApp;
  let owner: TestUser;
  let admin: TestUser;
  let adminCookies: string;
  let userCookies: string;
  let postIds: number[] = [];

  beforeAll(async () => {
    testApp = await createTestApp();

    const o = await createAndLogin(testApp.app, testApp.prisma, {
      username: `bulk_o_${Date.now()}`,
    });
    owner = o.user;
    userCookies = o.cookieHeader;

    const a = await createAndLogin(testApp.app, testApp.prisma, {
      username: `bulk_a_${Date.now()}`,
      role: 'ADMIN',
    });
    admin = a.user;
    adminCookies = a.cookieHeader;

    const created = await Promise.all(
      [1, 2, 3].map((n) =>
        testApp.prisma.post.create({
          data: {
            title: `Bulk post ${n}`,
            content: 'content',
            creatorId: owner.id,
          },
        }),
      ),
    );
    postIds = created.map((p) => p.id);
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, owner.id);
    await cleanupUser(testApp.prisma, admin.id);
    await testApp.app.close();
  });

  it('rejects non-admin', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/admin/posts/bulk-delete')
      .set('Cookie', userCookies)
      .send({ ids: postIds });

    expect(res.status).toBe(403);
  });

  it('soft-deletes many posts and skips already-deleted on repeat', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/admin/posts/bulk-delete')
      .set('Cookie', adminCookies)
      .send({ ids: postIds });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      affected: 3,
      skipped: 0,
    });

    const deleted = await testApp.prisma.post.count({
      where: { id: { in: postIds }, deleted: true },
    });
    expect(deleted).toBe(3);

    const again = await request(testApp.app.getHttpServer())
      .post('/admin/posts/bulk-delete')
      .set('Cookie', adminCookies)
      .send({ ids: postIds });

    expect(again.status).toBe(201);
    expect(again.body.data).toMatchObject({ affected: 0, skipped: 3 });
  });

  it('bulk-restores soft-deleted posts', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/admin/posts/bulk-restore')
      .set('Cookie', adminCookies)
      .send({ ids: postIds });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ affected: 3, skipped: 0 });

    const active = await testApp.prisma.post.count({
      where: { id: { in: postIds }, deleted: false },
    });
    expect(active).toBe(3);
  });
});
