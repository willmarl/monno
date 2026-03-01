import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OauthService } from './oauth.service';

/**
 * OAuth Controller
 *
 * Pattern for all OAuth providers:
 * 1. @Get('provider') - redirects user to provider's login page
 * 2. @Get('provider/callback') - handles provider's callback with authorization code
 *
 * To add a new provider (e.g., Twitter):
 * 1. Create getTwitterAuthUrl() in oauth.service.ts
 * 2. Create handleTwitterCallback() in oauth.service.ts
 * 3. Add @Get('twitter') route below
 * 4. Add @Get('twitter/callback') route below
 * 5. Add frontend button in LoginForm.tsx with href={`${apiUrl}/auth/twitter`}
 * 6. Update Prisma schema to add twitterId field to User model
 * 7. Add environment variables in .env: TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URL
 */
@ApiTags('auth')
@Controller('auth')
export class OauthController {
  constructor(private oauth: OauthService) {}

  /* ===== GOOGLE OAUTH ===== */

  /**
   * Step 1: Redirect user to Google login
   * User clicks "Continue with Google" button → hits this endpoint
   */
  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth login page',
  })
  @Get('google')
  async googleRedirect(@Res() res: any) {
    const url = this.oauth.getGoogleAuthUrl();
    return res.redirect(url);
  }

  /**
   * Step 2: Handle Google's callback
   * Google redirects user back here with authorization code
   */
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: 'Authorization code from Google',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication success',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or missing authorization code',
  })
  @Get('google/callback')
  async googleCallback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code: string,
  ) {
    const redirectUrl = await this.oauth.handleGoogleCallback(code, req, res);
    return res.redirect(redirectUrl);
  }

  /* ===== GITHUB OAUTH ===== */

  /**
   * Step 1: Redirect user to GitHub login
   * User clicks "Continue with GitHub" button → hits this endpoint
   */
  @ApiOperation({ summary: 'Redirect to GitHub OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to GitHub OAuth login page',
  })
  @Get('github')
  async githubRedirect(@Res() res: any) {
    const url = this.oauth.getGithubAuthUrl();
    return res.redirect(url);
  }

  /**
   * Step 2: Handle GitHub's callback
   * GitHub redirects user back here with authorization code
   */
  @ApiOperation({ summary: 'GitHub OAuth callback handler' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: 'Authorization code from GitHub',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with authentication success',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or missing authorization code',
  })
  @Get('github/callback')
  async githubCallback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code: string,
  ) {
    const redirectUrl = await this.oauth.handleGithubCallback(code, req, res);
    return res.redirect(redirectUrl);
  }

  /* ===== TWITTER OAUTH (EXAMPLE FOR ADDING NEW PROVIDER) ===== */

  /*
  // To add Twitter OAuth, uncomment and implement:

  @Get('twitter')
  async twitterRedirect(@Res() res: any) {
    const url = this.oauth.getTwitterAuthUrl();
    return res.redirect(url);
  }

  @Get('twitter/callback')
  async twitterCallback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code: string,
  ) {
    const redirectUrl = await this.oauth.handleTwitterCallback(code, req, res);
    return res.redirect(redirectUrl);
  }
  */
}
