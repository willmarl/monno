import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma.service';
import { QueueService } from '../../queue/queue.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { GeolocationService } from '../../../common/geolocation/geolocation.service';
import { RiskScoringService } from '../../../common/risk-scoring/risk-scoring.service';
import { suspiciousLoginTemplate } from '../../../common/email-templates';
import type { User } from '../../../generated/prisma/client';
/**
 * OAuth Service - Multi-provider authentication
 *
 * Architecture:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * - Twitter OAuth 2.0 (ready to add)
 *
 * Account Merging Strategy:
 * If user logs in with Google using email@example.com, then later logs in with GitHub
 * using the same email@example.com, the accounts are automatically linked.
 * User can use either provider to access the same account.
 *
 * To Add a New OAuth Provider (e.g., Twitter):
 *
 * 1. Add environment variables in .env:
 *    TWITTER_CLIENT_ID=xxx
 *    TWITTER_CLIENT_SECRET=xxx
 *    TWITTER_REDIRECT_URL=http://localhost:3001/auth/twitter/callback
 *
 * 2. Update Prisma schema (apps/api/prisma/schema.prisma):
 *    model User {
 *      ...existing fields...
 *      twitterId  String?  @unique  // Add this line
 *    }
 *    Then run: pnpm prisma migrate dev -n add_twitter_oauth
 *
 * 3. Add methods to OauthService:
 *    - getTwitterAuthUrl()
 *    - handleTwitterCallback(code, req, res)
 *
 * 4. Add routes to OauthController:
 *    - @Get('twitter')
 *    - @Get('twitter/callback')
 *
 * 5. Update LoginForm.tsx with Twitter button
 *
 * 6. Update type signature in upsertOauthUser() to include 'twitter'
 */
@Injectable()
export class OauthService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private jwt: JwtService,
    private geolocationService: GeolocationService,
    private riskScoringService: RiskScoringService,
    private http: HttpService,
  ) {}

  /* ===== GOOGLE OAUTH ===== */

  /**
   * Step 1: Get Google OAuth authorization URL
   */
  getGoogleAuthUrl() {
    const root = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    };

    const qs = new URLSearchParams(options as Record<string, string>);
    return `${root}?${qs.toString()}`;
  }

  /**
   * Step 2: Handle Google OAuth callback
   *
   * To add a new provider (e.g., Twitter):
   * 1. Create handleTwitterCallback() method
   * 2. Exchange code for access token from provider's token endpoint
   * 3. Fetch user profile from provider's API
   * 4. Call upsertOauthUser with provider='twitter'
   * 5. Add route in oauth.controller.ts
   * 6. Add frontend button in LoginForm
   */
  async handleGoogleCallback(
    code: string,
    req: any,
    res: any,
  ): Promise<string> {
    if (!code) {
      throw new BadRequestException('Authorization code is missing');
    }

    // Step 1: Exchange authorization code for access token
    const tokenRes = await this.http
      .post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: process.env.GOOGLE_REDIRECT_URL || '',
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      )
      .toPromise();

    const tokenData = tokenRes?.data as any;

    if (tokenData.error) {
      throw new BadRequestException(
        `Google OAuth error: ${tokenData.error_description}`,
      );
    }

    // Step 2: Fetch user profile from Google
    const profileRes = await this.http
      .get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })
      .toPromise();

    const profile = profileRes?.data as any;
    const email = profile.email;
    const googleId = profile.id;

    // Step 3: Upsert user (creates or merges with existing account)
    const user = await this.upsertOauthUser({
      provider: 'google',
      providerId: googleId,
      email,
      name: profile.name ?? profile.given_name ?? 'user',
    });

    // Step 4: Create session and set cookies
    await this.createSessionAndSetCookies(user.id, req, res);

    // Step 5: Redirect to frontend success page
    return `${process.env.FRONTEND_URL}/success`;
  }

  /* ===== GITHUB OAUTH ===== */

  /**
   * Step 1: Get GitHub OAuth authorization URL
   */
  getGithubAuthUrl() {
    const root = 'https://github.com/login/oauth/authorize';
    const qs = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: process.env.GITHUB_REDIRECT_URL || '',
      scope: 'user:email read:user',
    });

    return `${root}?${qs.toString()}`;
  }

  /**
   * Step 2: Handle GitHub OAuth callback
   *
   * To add a new provider (e.g., Twitter):
   * 1. Create handleTwitterCallback() method similar to this
   * 2. Exchange code for access token from provider's token endpoint
   * 3. Fetch user profile and email from provider's API
   * 4. Call upsertOauthUser with provider='twitter'
   * 5. Add route in oauth.controller.ts: @Get('twitter') and @Get('twitter/callback')
   * 6. Add frontend button in LoginForm component
   * 7. Add environment variables: TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URL
   * 8. Add twitterId field to Prisma User model (optional, for account linking)
   */
  async handleGithubCallback(
    code: string,
    req: any,
    res: any,
  ): Promise<string> {
    if (!code) {
      throw new BadRequestException('Authorization code is missing');
    }

    // Step 1: Prepare token exchange parameters
    const params = {
      code,
      client_id: process.env.GITHUB_CLIENT_ID || '',
      client_secret: process.env.GITHUB_CLIENT_SECRET || '',
      redirect_uri: process.env.GITHUB_REDIRECT_URL || '',
    };

    let githubUser: any;
    let email: string | null = null;

    try {
      // Step 2: Exchange authorization code for access token
      const tokenRes = await this.http
        .post(
          'https://github.com/login/oauth/access_token',
          new URLSearchParams(params).toString(),
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'NestJS-OAuth-App',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .toPromise();

      const tokenData = tokenRes?.data as any;

      if (tokenData.error) {
        throw new BadRequestException(`GitHub OAuth error: ${tokenData.error}`);
      }

      if (!tokenData.access_token) {
        throw new BadRequestException(
          'GitHub OAuth: Failed to obtain access token',
        );
      }

      // Step 3: Fetch user profile from GitHub
      const userRes = await this.http
        .get('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        .toPromise();

      githubUser = userRes?.data as any;

      // Step 4: Fetch email (GitHub may hide it in profile)
      if (!githubUser.email) {
        try {
          const emailRes = await this.http
            .get('https://api.github.com/user/emails', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            })
            .toPromise();
          const emails = emailRes?.data as any[];
          email = emails.find((e) => e.primary)?.email;
        } catch (err) {
          console.warn('[OAuth] Error fetching GitHub emails:', err);
        }
      } else {
        email = githubUser.email;
      }
    } catch (error) {
      console.error('[OAuth] GitHub OAuth flow error:', error);
      throw new BadRequestException(
        `GitHub OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Step 5: Upsert user (creates or merges with existing account)
    const user = await this.upsertOauthUser({
      provider: 'github',
      providerId: githubUser.id.toString(),
      email,
      name: githubUser.login,
    });

    // Step 6: Create session and set cookies
    await this.createSessionAndSetCookies(user.id, req, res);

    // Step 7: Redirect to frontend success page
    return `${process.env.FRONTEND_URL}/success`;
  }

  /* ===== GENERIC UPSERT ===== */

  /**
   * Find or create user via OAuth
   *
   * This is the core account merging logic:
   * 1. If provider ID exists → return existing user (already linked)
   * 2. If email exists → link new provider to existing account
   * 3. Otherwise → create new user with generated username and auto-generated password
   *
   * Philosophy: OAuth is a convenience layer on top of username/password auth.
   * All users get a password so they can:
   * - Access account without OAuth provider if needed
   * - Use password reset via email if they add email later
   * - Have full ownership of their account (not vendor lock-in)
   *
   * Works for any provider (google, github, twitter, etc.)
   */
  async upsertOauthUser({
    provider,
    providerId,
    email,
    name,
  }: {
    provider: 'google' | 'github' | 'twitter'; // Add new providers here
    providerId: string;
    email: string | null;
    name: string;
  }): Promise<User> {
    let user: User | null = null;
    const providerField = `${provider}Id`;

    // Strategy 1: User already has this OAuth provider linked
    user = await this.prisma.user.findFirst({
      where: { [providerField]: providerId },
    });

    if (user) {
      // If OAuth email has changed (e.g., user changed email in Google account),
      // auto-sync the email since OAuth is a trusted source
      if (email && email !== user.email) {
        return await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email, // Update to current OAuth email
            isEmailVerified: true, // Re-verify (from trusted provider)
            emailVerifiedAt: new Date(),
          },
        });
      }
      return user;
    }

    // Strategy 2: Email exists (account merging)
    // User previously created account with password/email, now logging in via OAuth
    if (email) {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        // Link this OAuth provider to existing account
        return this.prisma.user.update({
          where: { id: user.id },
          data: {
            [providerField]: providerId,
            isEmailVerified: true, // OAuth email is from trusted provider
            emailVerifiedAt: new Date(),
          },
        });
      }
    }

    // Strategy 3: New user - create account with generated username and password
    const baseUsername = this.sanitizeUsername(name);
    const username = await this.generateUniqueUsername(baseUsername);

    // Auto-generate a secure password for the new OAuth user
    const generatedPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    return this.prisma.user.create({
      data: {
        email,
        username,
        [providerField]: providerId,
        password: hashedPassword, // Auto-generated, user can access account without OAuth
        emailVerifiedAt: email ? new Date() : null, // OAuth email is from trusted provider
        isEmailVerified: email ? true : false, // Auto-verify email from OAuth provider
      },
    });
  }

  /* ===== SESSION & COOKIES ===== */

  /**
   * Create session and set cookies (same as regular login)
   */
  async createSessionAndSetCookies(userId: number, req: any, res: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Extract metadata from request
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      'unknown';

    // Get geolocation for the IP
    const geo = await this.geolocationService.getGeolocation(ipAddress);

    // Assess risk based on login patterns
    const riskAssessment = await this.riskScoringService.assessLoginRisk(
      userId,
      userAgent,
      ipAddress,
      geo?.countryCode || null,
    );

    // Create refresh token
    const refreshToken = randomUUID();
    const hashedRt = await bcrypt.hash(refreshToken, 10);

    // Create session
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashedRt,
        userAgent,
        ipAddress,
        location: geo ? this.geolocationService.formatLocation(geo) : null,
        country: geo?.countryCode || null,
        latitude: geo?.latitude || null,
        longitude: geo?.longitude || null,
        riskScore: riskAssessment.riskScore,
        isNewLocation: riskAssessment.isNewLocation,
        isNewDevice: riskAssessment.isNewDevice,
      },
    });

    // Create access token
    const payload = { sub: userId, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
      secret: process.env.ACCESS_TOKEN_SECRET,
    });

    // Set cookies (same pattern as your auth controller)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    // Send suspicious login email if risk score is high
    if (riskAssessment.riskScore >= 50 && user.email) {
      try {
        const deviceName = this.extractDeviceName(userAgent);
        const htmlContent = suspiciousLoginTemplate({
          userName: user.username,
          deviceName,
          location: geo
            ? this.geolocationService.formatLocation(geo)
            : 'Unknown',
          ipAddress,
          timestamp: new Date().toLocaleString(),
          sessionsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/me/sessions`,
        });

        await this.queue.enqueueEmail(
          user.email,
          '🔐 Suspicious Login Attempt Detected',
          htmlContent,
          'suspicious-login',
        );
      } catch (error) {
        // Log error but don't throw - allow login to proceed
        console.error('[OAuth] Failed to queue suspicious login email:', error);
      }
    }

    return session.id;
  }

  /**
   * Sanitize username by removing/replacing illegal characters
   */
  private sanitizeUsername(name: string): string {
    // Replace spaces and special characters with underscores
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_') // Replace illegal chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .slice(0, 20); // Limit length
  }

  /**
   * Generate a unique username by appending a number if needed
   */
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;
    const maxAttempts = 100;

    while (counter <= maxAttempts) {
      const exists = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!exists) {
        return username;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Fallback: use UUID-based username
    return `user_${randomUUID().slice(0, 8)}`;
  }

  /**
   * Extract device name from user agent string
   */
  private extractDeviceName(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    // Common patterns
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
      return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Windows')) return 'Windows Computer';
    if (userAgent.includes('Macintosh')) return 'Mac Computer';
    if (userAgent.includes('Linux')) return 'Linux Computer';

    // Fallback to first 50 chars
    return userAgent.substring(0, 50) + '...';
  }

  /**
   * Generate a random secure password for OAuth users
   * Format: 16 characters including uppercase, lowercase, numbers, and symbols
   * Example: "KxR9$mPq2L#wT5vN"
   *
   * Note: Password is generated but NOT sent to user. They can:
   * - Use OAuth login immediately
   * - Recover password via email if they add email later
   * - Use "forgot password" flow anytime
   */
  private generateRandomPassword(): string {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*-_=+';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each character type for security
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle to avoid predictable pattern (uppercase, lowercase, number, symbol at start)
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
