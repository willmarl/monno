import { ApiPropertyOptional } from '@nestjs/swagger';
import { ThemePreference } from 'src/generated/prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    enum: ThemePreference,
    description: 'UI theme preference',
    example: ThemePreference.DARK,
  })
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @ApiPropertyOptional({
    description: 'Layout prefs (shallow-merged). e.g. { "postsView": "grid" }',
    example: { postsView: 'grid' },
  })
  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Resume context (shallow-merged). e.g. { "path": "/collections", "tab": "posts" }',
    example: { path: '/collections', tab: 'posts' },
  })
  @IsOptional()
  @IsObject()
  resume?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Onboarding flags (shallow-merged). e.g. { "welcomeDismissed": true }',
    example: { welcomeDismissed: true },
  })
  @IsOptional()
  @IsObject()
  onboarding?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Snooze-until map (shallow-merged). Values are ISO timestamps. e.g. { "featureBanner": "2026-08-01T00:00:00.000Z" }',
    example: { featureBanner: '2026-08-01T00:00:00.000Z' },
  })
  @IsOptional()
  @IsObject()
  snoozes?: Record<string, unknown>;
}
