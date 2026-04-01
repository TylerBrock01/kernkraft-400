import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseRegisterDto {
  @IsNumber()
  @Min(0, { message: 'El balance real no puede ser negativo' })
  actualBalance: number;

  @IsOptional()
  @IsString()
  notes?: string; // Para excusas como: "Se me cayeron 10 pesos en la coladera"
}