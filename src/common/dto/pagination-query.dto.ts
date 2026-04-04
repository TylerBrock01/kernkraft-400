// src/common/dto/pagination-query.dto.ts
import { IsNumberString, IsOptional } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'El límite (take) debe ser un número válido' })
  take?: number;

  @IsOptional()
  @IsNumberString({}, { message: 'El salto (skip) debe ser un número válido' })
  skip?: number;
}