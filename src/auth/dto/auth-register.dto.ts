// src/auth/dto/auth-register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../roles/roles';

export class AuthRegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}