// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
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
    const { password, ...userData } = dto;

    // 1. Ciframos la contraseña antes de mandarla al UsersService
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Creamos el usuario con la pass ya cifrada
    return this.usersService.create({
      ...userData,
      password: hashedPassword,
      role: dto.role || Role.VENDEDOR,
    });
  }

  async validateUser(email: string, pass: string): Promise<any> {
    // IMPORTANTE: Buscamos el usuario incluyendo el password (que está oculto por defecto)
    const user = await this.usersService.findOneWithPassword(email);

    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}