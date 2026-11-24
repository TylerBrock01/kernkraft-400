import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString() name: string;
  @IsString() symbol: string;

  @IsOptional() @IsInt()
  baseUnitId?: number;

  @IsOptional() @IsNumber() @IsPositive()
  factor?: number;
}