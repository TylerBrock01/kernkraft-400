import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // 🔍 Nuestro nuevo radar

  @IsOptional()
  @IsNumberString({}, { message: 'El límite (take) debe ser un número' })
  take?: number;

  @IsOptional()
  @IsNumberString({}, { message: 'El salto (skip) debe ser un número' })
  skip?: number;
}