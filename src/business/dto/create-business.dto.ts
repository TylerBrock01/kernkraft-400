import { IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { BusinessType, SubscriptionPlan } from '../entities/business.entity';

export class CreateBusinessDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan, {
    message: 'El plan debe ser: LITE, STARTER, PRO, BUSINESS o ZENITH'
  })
  plan?: SubscriptionPlan;

  @IsEnum(BusinessType)
  type: BusinessType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  config?: {
    primaryColor: string;
    logoUrl: string;
    currency: string;
    taxRate: number;
  };
}