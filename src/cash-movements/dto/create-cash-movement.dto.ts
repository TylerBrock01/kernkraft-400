import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { CashMovementCategory, CashMovementType } from '../entities/cash-movement.entity';

export class CreateCashMovementDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsEnum(CashMovementCategory)
  @IsOptional() // Opcional porque si es una entrada simple (cambio), asume 'OTHER'
  category?: CashMovementCategory;
}