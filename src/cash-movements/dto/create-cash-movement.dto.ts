import { IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { CashMovementType } from '../entities/cash-movement.entity';

export class CreateCashMovementDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsString()
  @MinLength(3)
  reason: string;
}