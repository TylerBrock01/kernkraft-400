import { IsNumber, Min } from 'class-validator';

export class OpenRegisterDto {
  @IsNumber()
  @Min(0, { message: 'El fondo de caja inicial no puede ser negativo' })
  openingBalance: number;
}