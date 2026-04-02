import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested, ArrayNotEmpty } from 'class-validator';

export class RefundItemDto {
  @IsInt({ message: 'El ID del producto debe ser un número entero' })
  productId: number;

  @IsInt()
  @Min(1, { message: 'Debes devolver al menos 1 artículo' })
  quantityToReturn: number; // Cantidad total que el cliente pone en el mostrador

  @IsInt()
  @Min(0)
  defectiveQuantity: number; // De la cantidad anterior, cuántos vienen inservibles
}

export class RefundSaleDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'La lista de devoluciones no puede estar vacía' })
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  items: RefundItemDto[];

  @IsOptional()
  @IsString()
  reason?: string; // Ej: "El mouse venía quebrado de fábrica"
}