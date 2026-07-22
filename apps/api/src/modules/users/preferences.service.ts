import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
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
      data.layout = { ...asObject(current.layout), ...dto.layout };
    }
    if (dto.resume !== undefined) {
      data.resume = { ...asObject(current.resume), ...dto.resume };
    }
    if (dto.onboarding !== undefined) {
      data.onboarding = { ...asObject(current.onboarding), ...dto.onboarding };
    }
    if (dto.snoozes !== undefined) {
      data.snoozes = { ...asObject(current.snoozes), ...dto.snoozes };
    }

    return this.prisma.userPreferences.update({
      where: { userId },
      data,
    });
  }
}
