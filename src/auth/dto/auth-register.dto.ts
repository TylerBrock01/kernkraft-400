import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AuthRegisterDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
