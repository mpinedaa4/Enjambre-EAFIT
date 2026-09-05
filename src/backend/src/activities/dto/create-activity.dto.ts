import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  weight: number;

  @IsInt()
  groupId: number;

  @IsOptional()
  @IsInt()
  committeeId?: number;
}