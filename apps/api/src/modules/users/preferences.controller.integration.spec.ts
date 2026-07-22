import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('UsersController preferences (integration)', () => {
  let testApp: TestApp;
  let userA: TestUser;
  let cookiesA: string;
  let userB: TestUser;
  let cookiesB: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const a = await createAndLogin(testApp.app, testApp.prisma, {
      username: `prefs_a_${Date.now()}`,
    });
    userA = a.user;
    cookiesA = a.cookieHeader;

    const b = await createAndLogin(testApp.app, testApp.prisma, {
      username: `prefs_b_${Date.now()}`,
    });
    userB = b.user;
    cookiesB = b.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, userA.id);
    await cleanupUser(testApp.prisma, userB.id);
    await testApp.app.close();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(testApp.app.getHttpServer()).get(
      '/users/me/preferences',
    );
    expect(res.status).toBe(401);
  });

  it('GET creates defaults and returns owner prefs', async () => {
    const res = await request(testApp.app.getHttpServer())
      .get('/users/me/preferences')
      .set('Cookie', cookiesA);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(userA.id);
    expect(res.body.data.theme).toBe('SYSTEM');
    expect(res.body.data.layout).toEqual({});
    expect(res.body.data.resume).toEqual({});
    expect(res.body.data.onboarding).toEqual({});
    expect(res.body.data.snoozes).toEqual({});
  });

  it('PATCH updates theme and shallow-merges JSON bags', async () => {
    const res = await request(testApp.app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Cookie', cookiesA)
      .send({
        theme: 'DARK',
        layout: { postsView: 'grid' },
        onboarding: { welcomeDismissed: true },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.theme).toBe('DARK');
    expect(res.body.data.layout).toEqual({ postsView: 'grid' });
    expect(res.body.data.onboarding).toEqual({ welcomeDismissed: true });

    const merged = await request(testApp.app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Cookie', cookiesA)
      .send({
        layout: { density: 'compact' },
        snoozes: { featureBanner: '2026-08-01T00:00:00.000Z' },
      });

    expect(merged.status).toBe(200);
    expect(merged.body.data.theme).toBe('DARK');
    expect(merged.body.data.layout).toEqual({
      postsView: 'grid',
      density: 'compact',
    });
    expect(merged.body.data.onboarding).toEqual({ welcomeDismissed: true });
    expect(merged.body.data.snoozes).toEqual({
      featureBanner: '2026-08-01T00:00:00.000Z',
    });
  });

  it('does not expose another user’s preferences', async () => {
    const res = await request(testApp.app.getHttpServer())
      .get('/users/me/preferences')
      .set('Cookie', cookiesB);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(userB.id);
    expect(res.body.data.theme).toBe('SYSTEM');
  });
});
