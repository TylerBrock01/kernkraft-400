import { IsNotEmpty } from 'class-validator';

export class ApplyCouponDto {
  @IsNotEmpty({ message: 'coupon es requerido'})
  coupon_name: string;

}