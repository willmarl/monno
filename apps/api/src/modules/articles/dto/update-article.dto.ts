import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

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
  @IsString()
  imagePath?: string;
}
