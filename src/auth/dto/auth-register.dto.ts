// src/auth/dto/auth-register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '../roles/roles';

export class AuthRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // EL CANDADO DEL MCU:
  // Todo usuario debe nacer con un negocio asignado
  @IsNotEmpty({ message: 'El businessId es obligatorio' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId: string;
}