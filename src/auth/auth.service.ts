// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { Role } from './roles/roles';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: AuthRegisterDto, adminSecret?: string) {
    const { password, role, ...userData } = dto;

    if (role === Role.SUPER_ADMIN) {
      // Usamos el ConfigService para mayor seguridad
      const masterKey = this.configService.get<string>('SUPER_ADMIN_MASTER_KEY');

      if (adminSecret !== masterKey) {
        throw new UnauthorizedException('No tienes permiso para crear una cuenta de este nivel');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.usersService.create({
      ...userData,
      password: hashedPassword,
      role: role || Role.VENDEDOR,
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
      businessId: user.businessId, // <--- EL DATO MAESTRO
      plan: user.business?.plan || 'GENESIS'
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        plan: user.business?.plan // Opcional enviarlo al front también
      }
    };
  }
}