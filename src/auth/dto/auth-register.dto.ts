import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '../roles/roles';

export class AuthRegisterDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional() // Permite que sea opcional para que use el default
  @IsEnum(Role, { message: 'El rol no es válido' }) // Valida contra tu Enum
  role?: Role;
}
