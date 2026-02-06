import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @(IsNotEmpty({ message: 'nombre es requerido'}))
  @(IsString({ message: 'nombre debe ser string'}))
  name: string;
  // @(IsNotEmpty({ message: 'imagen es requerido'}))
  // image: string;
  @(IsNotEmpty({ message: 'precio es requerido'}))
  @(IsNumber({maxDecimalPlaces: 2}, { message: 'precio debe ser un numero'}))
  price: number;
  @(IsNotEmpty({ message: 'stock es requerido'}))
  @(IsNumber({maxDecimalPlaces: 0}, { message: 'stock debe ser un numero'}))
  stock: number;
  @(IsNotEmpty({ message: 'categoria es requerido'}))
  @(IsInt( { message: 'categoria debe ser un numero'}))
  categoryId: number;
  @(IsNotEmpty({ message: 'color es requerido'}))
  @(IsString({ message: 'color debe ser texto'}))
  color: string;
  @(IsNotEmpty({ message: 'medida es requerida'}))
  @(IsNumber({maxDecimalPlaces: 2}, { message: 'medida debe ser un numero'}))
  size: number;
  @IsNotEmpty({ message: 'deck es requerido'})
  @(IsInt( { message: 'deck debe ser un numero'}))
  deckId: number;
}
