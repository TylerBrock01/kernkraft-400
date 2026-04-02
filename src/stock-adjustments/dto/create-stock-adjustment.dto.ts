import { IsInt, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { AdjustmentReason } from '../entities/stock-adjustment.entity';

export class CreateStockAdjustmentDto {
  @IsInt()
  productId: number; // Validamos que sea un número entero

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @IsOptional()
  @IsString()
  notes?: string;
}