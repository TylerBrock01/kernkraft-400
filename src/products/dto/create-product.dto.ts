import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, Min, IsInt } from 'class-validator';
import { BusinessType } from '../../business/entities/business.entity';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser un texto' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsNotEmpty({ message: 'El slug es requerido' })
  @IsString()
  slug: string;

  @IsNotEmpty({ message: 'El precio es requerido' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsNotEmpty({ message: 'El stock es requerido' })
  @IsInt()
  @Min(0)
  stock: number;

  @IsNotEmpty({ message: 'La imagen es requerida' })
  @IsString()
  image: string;

  @IsNotEmpty({ message: 'El tipo de industria es requerido' })
  @IsEnum(BusinessType)
  type: BusinessType;

  // FLEXIBILIDAD TOTAL: Aquí entra cualquier campo extra (color, talla, ingredientes)
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}