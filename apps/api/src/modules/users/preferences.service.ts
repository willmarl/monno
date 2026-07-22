import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: number) {
    const existing = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return this.prisma.userPreferences.create({
      data: { userId },
    });
  }

  async update(userId: number, dto: UpdatePreferencesDto) {
    const current = await this.getOrCreate(userId);

    const data: Prisma.UserPreferencesUpdateInput = {};

    if (dto.theme !== undefined) {
      data.theme = dto.theme;
    }
    if (dto.layout !== undefined) {
      data.layout = {
        ...asObject(current.layout),
        ...(dto.layout as Prisma.InputJsonObject),
      };
    }
    if (dto.resume !== undefined) {
      data.resume = {
        ...asObject(current.resume),
        ...(dto.resume as Prisma.InputJsonObject),
      };
    }
    if (dto.onboarding !== undefined) {
      data.onboarding = {
        ...asObject(current.onboarding),
        ...(dto.onboarding as Prisma.InputJsonObject),
      };
    }
    if (dto.snoozes !== undefined) {
      data.snoozes = {
        ...asObject(current.snoozes),
        ...(dto.snoozes as Prisma.InputJsonObject),
      };
    }
    if (dto.notifyInAppComments !== undefined) {
      data.notifyInAppComments = dto.notifyInAppComments;
    }
    if (dto.notifyInAppLikes !== undefined) {
      data.notifyInAppLikes = dto.notifyInAppLikes;
    }
    if (dto.notifyEmailComments !== undefined) {
      data.notifyEmailComments = dto.notifyEmailComments;
    }
    if (dto.notifyEmailLikes !== undefined) {
      data.notifyEmailLikes = dto.notifyEmailLikes;
    }

    return this.prisma.userPreferences.update({
      where: { userId },
      data,
    });
  }
}
