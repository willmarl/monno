import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderMediaDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids!: number[];
}
