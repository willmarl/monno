import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const user = await this.usersService.create(data);

    // Provide tokens immediately on register
    return this.issueTokens(user.id);
  }

  async login({ username, password }: LoginDto) {
    const user = await this.usersService.findByUsernameAuth(username);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id);
  }

  async issueTokens(userId: number) {
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

    const hashed = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
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
}
