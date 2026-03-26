import { IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { BusinessType } from '../entities/business.entity';

export class CreateBusinessDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  slug: string;

  @IsEnum(BusinessType)
  type: BusinessType;

  @IsOptional()
  @IsObject()
  config?: {
    primaryColor: string;
    logoUrl: string;
    currency: string;
    taxRate: number;
  };
}