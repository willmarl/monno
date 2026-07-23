import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OauthService } from './oauth.service';

/**
 * OAuth Controller
 *
 * Pattern for all OAuth providers:
 * 1. @Get('provider') - redirects user to provider's login page (sets state + PKCE cookies)
 * 2. @Get('provider/callback') - validates state, exchanges code (+ verifier), sets session cookies
 *
 * To add a new provider (e.g., Twitter):
 * 1. Create beginTwitterAuth() / handleTwitterCallback() in oauth.service.ts
 * 2. Add @Get('twitter') and @Get('twitter/callback') below
 * 3. Add frontend button with href={`${apiUrl}/auth/twitter`}
 * 4. Update Prisma schema for twitterId if needed
 * 5. Add TWITTER_* env vars
 */
@ApiTags('auth')
@Controller('auth')
export class OauthController {
  constructor(private oauth: OauthService) {}

  /* ===== GOOGLE OAUTH ===== */

  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth login page',
  })
  @Get('google')
  async googleRedirect(@Res() res: any) {
    const url = this.oauth.beginGoogleAuth(res);
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: 'Authorization code from Google',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    type: String,
    description: 'CSRF state issued at authorize time',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication success',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or missing authorization code or state',
  })
  @Get('google/callback')
  async googleCallback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const redirectUrl = await this.oauth.handleGoogleCallback(
      code,
      state,
      req,
      res,
    );
    return res.redirect(redirectUrl);
  }

  /* ===== GITHUB OAUTH ===== */

  @ApiOperation({ summary: 'Redirect to GitHub OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to GitHub OAuth login page',
  })
  @Get('github')
  async githubRedirect(@Res() res: any) {
    const url = this.oauth.beginGithubAuth(res);
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'GitHub OAuth callback handler' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: 'Authorization code from GitHub',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    type: String,
    description: 'CSRF state issued at authorize time',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication success',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or missing authorization code or state',
  })
  @Get('github/callback')
  async githubCallback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const redirectUrl = await this.oauth.handleGithubCallback(
      code,
      state,
      req,
      res,
    );
    return res.redirect(redirectUrl);
  }
}
