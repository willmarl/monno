import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';
import { RedisService } from 'src/common/redis/redis.service';

describe('PresenceController (integration)', () => {
  let testApp: TestApp;
  let user: TestUser;
  let userCookies: string;
  let redisReady = false;

  beforeAll(async () => {
    testApp = await createTestApp();
    const redis = testApp.app.get(RedisService);
    redisReady = redis.isReady();

    const logged = await createAndLogin(testApp.app, testApp.prisma, {
      username: `pres_${Date.now()}`,
    });
    user = logged.user;
    userCookies = logged.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, user.id);
    await testApp.app.close();
  });

  it('sets anonId cookie and guest=true when unauthenticated', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/presence/heartbeat')
      .send();

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ ok: true, guest: true });

    const setCookie = res.headers['set-cookie'] as string[] | string | undefined;
    const cookies = Array.isArray(setCookie)
      ? setCookie
      : setCookie
        ? [setCookie]
        : [];
    expect(cookies.some((c) => c.startsWith('anonId='))).toBe(true);
  });

  it('skips guest presence when logged in', async () => {
    const res = await request(testApp.app.getHttpServer())
      .post('/presence/heartbeat')
      .set('Cookie', userCookies)
      .send();

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ ok: true, guest: false });
  });

  it('counts guests in admin presence when Redis is up', async () => {
    if (!redisReady) {
      return; // degrade gracefully in CI without Redis
    }

    const hb = await request(testApp.app.getHttpServer())
      .post('/presence/heartbeat')
      .send();
    expect(hb.status).toBe(201);

    const admin = await createAndLogin(testApp.app, testApp.prisma, {
      username: `pres_a_${Date.now()}`,
      role: 'ADMIN',
    });

    const stats = await request(testApp.app.getHttpServer())
      .get('/admin/stats')
      .set('Cookie', admin.cookieHeader);

    expect(stats.status).toBe(200);
    expect(stats.body.data.presence.guests).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.presence.activeNow).toBe(
      stats.body.data.presence.users + stats.body.data.presence.guests,
    );

    await cleanupUser(testApp.prisma, admin.user.id);
  });
});
