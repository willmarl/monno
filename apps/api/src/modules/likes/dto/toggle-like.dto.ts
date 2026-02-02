import { IsNumber, IsString } from 'class-validator';

export class ToggleLikeDto {
  @IsString()
  resourceType!: 'POST';
  // resourceType!: 'POST' | 'VIDEO' | 'ARTICLE';

  @IsNumber()
  resourceId!: number;
}
