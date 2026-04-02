// src/auth/guards/business-active.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { Role } from '../roles/roles';

@Injectable()
export class BusinessActiveGuard implements CanActivate {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ESTRATEGIA DE EXTRACCIÓN
    const businessId = request.user?.businessId || request.query.businessId;

    if (!businessId) {
      throw new BadRequestException('Se requiere un Business ID para acceder a este recurso.');
    }

    // BYPASS: El SuperAdmin de la agencia siempre pasa
    if (request.user?.role === Role.SUPER_ADMIN) return true;

    // 🔍 Extraemos también la fecha de licencia
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['isActive', 'name', 'licenseValidUntil']
    });

    if (!business) {
      throw new ForbiddenException('Negocio no encontrado.');
    }

    // 🛑 REGLA 1: Apagado manual (Baneo o cancelación)
    if (!business.isActive) {
      throw new ForbiddenException(`El negocio "${business.name}" está temporalmente suspendido.`);
    }

    // ⏳ REGLA 2: Licencia expirada
    // Si tiene fecha límite, verificamos que el día de hoy sea MENOR a esa fecha
    if (business.licenseValidUntil) {
      const now = new Date();
      if (now > business.licenseValidUntil) {
        throw new ForbiddenException(
          `La licencia del negocio "${business.name}" expiró el ${business.licenseValidUntil.toLocaleDateString()}. Por favor, renueva la suscripción.`
        );
      }
    }

    return true;
  }
}