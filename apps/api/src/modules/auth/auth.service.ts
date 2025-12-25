import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Request } from 'express';
import { GeolocationService } from '../../common/geolocation/geolocation.service';
import { RiskScoringService } from '../../common/risk-scoring/risk-scoring.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwt: JwtService,
    private geolocationService: GeolocationService,
    private riskScoringService: RiskScoringService,
  ) {}

  async register(data: RegisterDto, req: Request) {
    const user = await this.usersService.create(data);

    // Provide tokens immediately on register with session metadata
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      'unknown';

    return this.issueTokens(user.id, {
      userAgent,
      ipAddress,
    });
  }

  async login({ username, password }: LoginDto, req: Request) {
    const user = await this.usersService.findByUsernameAuth(username);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Extract metadata from request
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      'unknown';

    return this.issueTokens(user.id, {
      userAgent,
      ipAddress,
    });
  }

  async issueTokens(
    userId: number,
    sessionMetadata?: { userAgent: string; ipAddress: string } | null,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('User not found');

    const payload = { sub: userId, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
      secret: process.env.ACCESS_TOKEN_SECRET,
    });

    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    const hashedRt = await bcrypt.hash(refreshToken, 10);

    // If sessionMetadata provided, create a new session (login flow)
    // Otherwise, just update user's refresh token (backward compatibility for register)
    if (sessionMetadata) {
      // Get geolocation for the IP
      const geo = await this.geolocationService.getGeolocation(
        sessionMetadata.ipAddress,
      );

      // Assess risk based on login patterns
      const riskAssessment = await this.riskScoringService.assessLoginRisk(
        userId,
        sessionMetadata.userAgent,
        sessionMetadata.ipAddress,
        geo?.countryCode || null,
      );

      // Create session with all metadata
      const session = await this.prisma.session.create({
        data: {
          userId,
          refreshTokenHash: hashedRt,
          userAgent: sessionMetadata.userAgent,
          ipAddress: sessionMetadata.ipAddress,
          location: geo ? this.geolocationService.formatLocation(geo) : null,
          country: geo?.countryCode || null,
          latitude: geo?.latitude || null,
          longitude: geo?.longitude || null,
          riskScore: riskAssessment.riskScore,
          isNewLocation: riskAssessment.isNewLocation,
          isNewDevice: riskAssessment.isNewDevice,
        },
      });

      return {
        accessToken,
        refreshToken,
        sessionId: session.id,
      };
    }

    // Fallback for register (no session metadata)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRt },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: number, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh');

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh');

    return this.issueTokens(user.id);
  }

  async clearRefreshToken(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh');

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) throw new UnauthorizedException('Invalid refresh');

    return this.issueTokens(userId);
  }

  async refreshTokensBySession(sessionId: string, refreshToken: string) {
    // Validate session exists and is valid
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || !session.isValid)
      throw new UnauthorizedException('Invalid or expired session');

    // Validate refresh token matches hashed token
    const tokenMatches = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash || '',
    );

    if (!tokenMatches) throw new UnauthorizedException('Invalid refresh token');

    // Generate new tokens
    const user = session.user;
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
      secret: process.env.ACCESS_TOKEN_SECRET,
    });

    const newRefreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    const newHash = await bcrypt.hash(newRefreshToken, 10);

    // Rotate refresh token and update session
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newHash,
        lastUsedAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    };
  }

  async invalidateSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });
  }

  async invalidateAllSessions(userId: number) {
    return this.prisma.session.updateMany({
      where: { userId },
      data: { isValid: false },
    });
  }
}
