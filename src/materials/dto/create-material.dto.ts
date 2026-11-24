import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MaterialType } from '../entities/material.entity';

export class CreateMaterialDto {
  @IsString() name: string;
  @IsString() sku: string;

  @IsOptional() @IsEnum(MaterialType)
  type?: MaterialType;

  @IsInt()
  baseUnitId: number;

  @IsOptional() @IsNumber() @Min(0)
  minStock?: number;

  @IsOptional() @IsBoolean()
  allowNegativeStock?: boolean;
}