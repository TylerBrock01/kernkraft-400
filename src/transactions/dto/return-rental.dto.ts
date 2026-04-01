import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReturnRentalDto {
  @IsOptional()
  @IsNumber({}, { message: 'La penalización debe ser un número' })
  @Min(0, { message: 'La penalización no puede ser negativa' })
  penaltyAmount?: number;

  @IsOptional()
  @IsString()
  penaltyReason?: string; // Ej: "Trajo la carpa rota y llena de lodo"
}