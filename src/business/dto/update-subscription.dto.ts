import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Debe ser una fecha ISO válida (ej. 2026-05-01T00:00:00Z)' })
  licenseValidUntil?: string;
}