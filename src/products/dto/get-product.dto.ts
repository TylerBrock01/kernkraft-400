import { IsNotEmpty, IsNumber, IsNumberString, IsOptional } from 'class-validator';

export class GetProductQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'category_id debe ser un numero' })
  category_id?: number;

  @IsOptional()
  @IsNumberString({}, { message: 'la cantidad debe ser un numero' })
  take?: number;

}