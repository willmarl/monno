import { IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { ArticleStatus } from '../../../generated/prisma/client';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @IsEnum(ArticleStatus)
  status!: ArticleStatus;
}
