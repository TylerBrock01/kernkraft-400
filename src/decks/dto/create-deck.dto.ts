import { IsNotEmpty, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty({message: 'tipo de tabla es requerido'})
  name: string;
}
