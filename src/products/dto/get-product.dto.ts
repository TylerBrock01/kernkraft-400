import { IsNotEmpty, IsNumber, IsNumberString, IsOptional } from 'class-validator';

export class GetProductQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'category_id debe ser un numero' })
  category_id?: number;
}