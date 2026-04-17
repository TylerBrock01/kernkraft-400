import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, Min, IsInt, IsBoolean } from 'class-validator';
import { BusinessType } from '../../business/entities/business.entity';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser un texto' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNotEmpty({ message: 'El precio es requerido' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsNotEmpty({ message: 'El stock es requerido' })
  @Type(() => Number) // Asegura que el valor se trate como número
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'El stock debe ser un número con máximo 2 decimales' }
  )
  @Min(0, { message: 'El stock no puede ser menor a 0' })
  stock: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty({ message: 'El tipo de industria es requerido' })
  @IsEnum(BusinessType)
  type: BusinessType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // FLEXIBILIDAD TOTAL: Aquí entra cualquier campo extra (color, talla, ingredientes)
  @IsOptional()
  @Transform(({ value }) => {
    try { return typeof value === 'string' ? JSON.parse(value) : value; }
    catch (e) { return value; }
  })
  @IsObject()
  metadata?: Record<string, any>;
}