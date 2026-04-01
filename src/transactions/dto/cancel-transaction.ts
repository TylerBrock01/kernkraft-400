// src/transactions/dto/cancel-transaction.dto.ts
import { IsOptional, IsString, Length } from 'class-validator';

export class CancelTransactionDto {
  @IsOptional()
  @IsString()
  @Length(5, 255, { message: 'El motivo debe tener entre 5 y 255 caracteres' })
  reason?: string;
}