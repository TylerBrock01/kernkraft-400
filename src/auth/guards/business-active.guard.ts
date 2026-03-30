// src/auth/guards/business-active.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException, BadRequestException
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
  // src/auth/guards/business-active.guard.ts

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ESTRATEGIA DE EXTRACCIÓN:
    // 1. Intentamos sacar el ID del Token (si el usuario está logueado)
    // 2. Si no hay token, lo buscamos en los Query Params (?businessId=...)
    const businessId = request.user?.businessId || request.query.businessId;

    if (!businessId) {
      throw new BadRequestException('Se requiere un Business ID para acceder a este recurso.');
    }

    // BYPASS: El SuperAdmin siempre pasa, incluso si el negocio está "apagado"
    if (request.user?.role === Role.SUPER_ADMIN) return true;

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['isActive', 'name']
    });

    if (!business || !business.isActive) {
      throw new ForbiddenException(
        business
          ? `El negocio "${business.name}" está temporalmente suspendido.`
          : 'Negocio no encontrado.'
      );
    }

    return true;
  }

}