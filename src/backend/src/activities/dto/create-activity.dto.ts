import { IsNotEmpty, IsString, IsInt, ValidateIf } from 'class-validator';

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

  @ValidateIf((object, value) => value !== null)
  @IsInt()
  committeeId: number | null;
}