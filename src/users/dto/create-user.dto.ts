// src/users/dto/create-user.dto.ts
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '../../auth/roles/roles';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // EL REQUISITO INDUSTRIAL:
  @IsOptional()
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId: string;
}