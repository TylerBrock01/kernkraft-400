import { IsDateString, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateCouponDto {

  @IsNotEmpty({ message: 'nombre es requerido' })
  name: string;

  @IsNotEmpty({ message: 'descuento es requerido' })
  @IsInt({ message: 'descuento debe ser un numero'})
  @Max(100, { message: 'el descuento debe ser menor a 100' })
  @Min(1, { message: 'el descuento debe ser mayor a 1' })
  discount: number;

  @IsNotEmpty({ message: 'fecha de expiracion es requerido' })
  @IsDateString({}, { message: 'fecha de expiracion debe ser una fecha valida' })
  expirationDate: Date;
}
