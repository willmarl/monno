import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    minLength: 1,
    maxLength: 150,
    example: 'My First Post',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    description: 'Post content',
    minLength: 1,
    maxLength: 1000,
    example: 'This is the content of my post with all the details.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
