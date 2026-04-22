import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ArticleStatus } from '../../../generated/prisma/client';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
