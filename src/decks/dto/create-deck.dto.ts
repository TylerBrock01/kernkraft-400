import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty({message: 'tipo de tabla es requerido'})
  name: string;
}
