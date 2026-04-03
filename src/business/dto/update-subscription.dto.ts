import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt({ message: 'Los meses a renovar deben ser un número entero' })
  @Min(1, { message: 'Debes añadir al menos 1 mes a la suscripción' })
  monthsToAdd?: number;
}