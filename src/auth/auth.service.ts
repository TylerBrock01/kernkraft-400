// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { Role } from './roles/roles';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(dto: AuthRegisterDto) {
    // 1. Verificamos que el DTO traiga el businessId (regla del MCU)
    const { password, ...userData } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Pasamos TODO el userData (que ya debe incluir businessId)
    return this.usersService.create({
      ...userData,
      password: hashedPassword,
      role: dto.role || Role.VENDEDOR,
      // El businessId ya viene dentro de userData si el DTO está bien hecho
    });
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneWithPassword(email);

    if (user && await bcrypt.compare(pass, user.password)) {
      // Sacamos el password y dejamos el resto (incluyendo el businessId)
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // EL PASAPORTE INDUSTRIAL:
    // Incluimos el businessId en el payload para que el decorador @GetBusinessId lo encuentre
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      businessId: user.businessId // <--- EL DATO MAESTRO
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId
      }
    };
  }
}