import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

export interface TestUser {
  id: number;
  username: string;
  plainPassword: string;
}

/**
 * Creates a user directly in the DB (bypasses the register endpoint).
 * Returns the user record and the plaintext password for login.
 */
export async function createTestUser(
  prisma: PrismaService,
  {
    username,
    password = 'TestPassword123',
    role = 'USER',
    status = 'ACTIVE',
  }: {
    username?: string;
    password?: string;
    role?: string;
    status?: string;
  } = {},
): Promise<TestUser> {
  const finalUsername = username ?? `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: finalUsername,
      password: hashedPassword,
      status: status as any,
      role: role as any,
    },
  });

  return { id: user.id, username: user.username, plainPassword: password };
}

/**
 * Logs in via POST /auth/login and returns the cookie string to use
 * in subsequent requests: .set('Cookie', cookieHeader)
 */
export async function loginAs(
  app: INestApplication,
  username: string,
  password: string,
): Promise<{ cookieHeader: string; sessionId: string | undefined; statusCode: number }> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username, password });

  const setCookies = (res.headers['set-cookie'] as string[] | string) ?? [];
  const cookieArray = Array.isArray(setCookies) ? setCookies : [setCookies];
  const cookieHeader = cookieArray.map((c) => c.split(';')[0]).join('; ');

  // Extract sessionId from the set-cookie array (raw, before joining)
  const sessionCookie = cookieArray.find((c) => c.startsWith('sessionId='));
  const sessionId = sessionCookie ? sessionCookie.split(';')[0].split('=')[1] : undefined;

  return { cookieHeader, sessionId, statusCode: res.status };
}

/**
 * Creates a test user and immediately logs in.
 * Returns both the user info and the cookie header.
 */
export async function createAndLogin(
  app: INestApplication,
  prisma: PrismaService,
  opts: Parameters<typeof createTestUser>[1] = {},
): Promise<{ user: TestUser; cookieHeader: string; sessionId: string | undefined; loginStatus: number }> {
  const user = await createTestUser(prisma, opts);
  const { cookieHeader, sessionId, statusCode } = await loginAs(app, user.username, user.plainPassword);
  return { user, cookieHeader, sessionId, loginStatus: statusCode };
}
