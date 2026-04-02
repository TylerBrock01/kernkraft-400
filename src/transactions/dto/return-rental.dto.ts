import { IsNumber, IsOptional, IsString, Min, ValidateNested, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class DamagedItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ReturnRentalDto {
  @IsOptional()
  @IsNumber({}, { message: 'La penalización debe ser un número' })
  @Min(0, { message: 'La penalización no puede ser negativa' })
  penaltyAmount?: number;

  @IsOptional()
  @IsString()
  penaltyReason?: string; // Ej: "Trajo la carpa rota y llena de lodo"

  // 🚨 NUEVO: Lista exacta de qué se rompió y cuánto
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DamagedItemDto)
  damagedItems?: DamagedItemDto[];
}