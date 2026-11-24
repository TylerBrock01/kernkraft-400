import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ReceiveStockDto {
  @IsNumber() @IsPositive()
  quantity: number; // en la unidad base del material

  @IsNumber() @Min(0)
  unitCost: number;

  @IsOptional() @IsString()
  note?: string;
}