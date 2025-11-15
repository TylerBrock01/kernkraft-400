import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @(IsNotEmpty({ message: 'nombre es requerido'}))
  name: string;

  price: number;
  stock: number;
  categoryId: number;
}
