import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';

describe('CollectionsController (integration)', () => {
  let testApp: TestApp;
  let owner: TestUser;
  let ownerCookies: string;
  let otherUser: TestUser;
  let otherCookies: string;
  let testPostId: number;

  beforeAll(async () => {
    testApp = await createTestApp();

    const o = await createAndLogin(testApp.app, testApp.prisma, {
      username: `col_owner_${Date.now()}`,
    });
    owner = o.user;
    ownerCookies = o.cookieHeader;

    const other = await createAndLogin(testApp.app, testApp.prisma, {
      username: `col_other_${Date.now()}`,
    });
    otherUser = other.user;
    otherCookies = other.cookieHeader;

    // A post to add to collections
    const post = await testApp.prisma.post.create({
      data: { title: 'For Collection', content: 'x', creatorId: owner.id },
    });
    testPostId = post.id;
  });

  afterAll(async () => {
    await testApp.prisma.post.delete({ where: { id: testPostId } });
    await cleanupUser(testApp.prisma, owner.id);
    await cleanupUser(testApp.prisma, otherUser.id);
    await testApp.app.close();
  });

  // ── POST /collections ─────────────────────────────────────────────────────

  describe('POST /collections', () => {
    it('creates a collection and returns 201', async () => {
      const name = `My Collection ${Date.now()}`;

      const res = await request(testApp.app.getHttpServer())
        .post('/collections')
        .set('Cookie', ownerCookies)
        .send({ name });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(name);
      expect(res.body.data.creator.id).toBe(owner.id);

      // Cleanup
      await testApp.prisma.collection.delete({ where: { id: res.body.data.id } });
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/collections')
        .send({ name: 'Unauthorized Collection' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/collections')
        .set('Cookie', ownerCookies)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── GET /collections/:id ──────────────────────────────────────────────────

  describe('GET /collections/:id', () => {
    let collectionId: number;

    beforeAll(async () => {
      const col = await testApp.prisma.collection.create({
        data: { name: `Readable ${Date.now()}`, creatorId: owner.id },
      });
      collectionId = col.id;
    });

    afterAll(async () => {
      await testApp.prisma.collection.deleteMany({ where: { id: collectionId } });
    });

    it('returns 200 with the collection data', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get(`/collections/${collectionId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(collectionId);
    });

    it('returns 404 for a non-existent collection', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/collections/999999');

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /collections/:id ────────────────────────────────────────────────

  describe('PATCH /collections/:id', () => {
    let collectionId: number;

    beforeAll(async () => {
      const col = await testApp.prisma.collection.create({
        data: { name: `To Patch ${Date.now()}`, creatorId: owner.id },
      });
      collectionId = col.id;
    });

    afterAll(async () => {
      await testApp.prisma.collection.deleteMany({ where: { id: collectionId } });
    });

    it('allows the owner to update their collection (200)', async () => {
      const newName = `Updated ${Date.now()}`;

      const res = await request(testApp.app.getHttpServer())
        .patch(`/collections/${collectionId}`)
        .set('Cookie', ownerCookies)
        .send({ name: newName });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(newName);
    });

    it('returns 403 when another user tries to update', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/collections/${collectionId}`)
        .set('Cookie', otherCookies)
        .send({ name: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .patch(`/collections/${collectionId}`)
        .send({ name: 'No auth' });

      expect(res.status).toBe(401);
    });
  });

  // ── POST /collections/:id/items ────────────────────────────────────────────

  describe('POST /collections/:id/items', () => {
    let collectionId: number;

    beforeAll(async () => {
      const col = await testApp.prisma.collection.create({
        data: { name: `Items Test ${Date.now()}`, creatorId: owner.id },
      });
      collectionId = col.id;
    });

    afterAll(async () => {
      await testApp.prisma.collection.delete({ where: { id: collectionId } });
    });

    it('adds a post to the collection (201)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .set('Cookie', ownerCookies)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(201);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(401);
    });

    it('returns 403 when another user tries to add an item', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .set('Cookie', otherCookies)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(403);
    });

    it('returns 409 when adding the same post to a collection twice', async () => {
      // First add
      await request(testApp.app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .set('Cookie', ownerCookies)
        .send({ resourceType: 'POST', resourceId: testPostId });

      // Second add — same item, same collection
      const res = await request(testApp.app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .set('Cookie', ownerCookies)
        .send({ resourceType: 'POST', resourceId: testPostId });

      expect(res.status).toBe(409);
    });
  });

  // ── DELETE /collections/:id ───────────────────────────────────────────────

  describe('DELETE /collections/:id', () => {
    it('allows the owner to delete their collection (204)', async () => {
      const col = await testApp.prisma.collection.create({
        data: { name: `To Delete ${Date.now()}`, creatorId: owner.id },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/collections/${col.id}`)
        .set('Cookie', ownerCookies);

      expect(res.status).toBe(204);

      const dbCol = await testApp.prisma.collection.findUnique({ where: { id: col.id } });
      expect(dbCol?.deleted).toBe(true);

      await testApp.prisma.collection.delete({ where: { id: col.id } });
    });

    it('returns 403 when another user tries to delete', async () => {
      const col = await testApp.prisma.collection.create({
        data: { name: `Protected ${Date.now()}`, creatorId: owner.id },
      });

      const res = await request(testApp.app.getHttpServer())
        .delete(`/collections/${col.id}`)
        .set('Cookie', otherCookies);

      expect(res.status).toBe(403);

      await testApp.prisma.collection.delete({ where: { id: col.id } });
    });
  });
});
