// src/coupons/dto/apply-coupon.dto.ts
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ApplyCouponDto {
  @IsNotEmpty({ message: 'El código del cupón es requerido' })
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  coupon_name: string;

  @IsNumber({}, { message: 'El total debe ser un valor numérico' })
  @Min(0, { message: 'El total no puede ser negativo' })
  total: number; // 👈 Inyectamos el valor actual del carrito
}