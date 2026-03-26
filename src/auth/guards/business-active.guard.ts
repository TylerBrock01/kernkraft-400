// src/auth/guards/business-active.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException
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
    const { user } = context.switchToHttp().getRequest();

    // REGLA 1: El SUPER_ADMIN es inmune al Killswitch (Él es quien lo opera)
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // REGLA 2: Si no tiene businessId y no es SuperAdmin, algo está mal
    if (!user.businessId) {
      throw new ForbiddenException('Usuario sin negocio vinculado');
    }

    // REGLA 3: Consultar el estado real en la base de datos
    const business = await this.businessRepository.findOne({
      where: { id: user.businessId },
      select: ['isActive', 'name'] // Solo traemos lo necesario para ser veloces
    });

    if (!business) {
      throw new NotFoundException('El negocio vinculado ya no existe');
    }

    // EL MOMENTO DE LA VERDAD (Killswitch)
    if (!business.isActive) {
      throw new ForbiddenException(
        `El acceso a "${business.name}" ha sido suspendido por el administrador de la plataforma.`
      );
    }

    return true;
  }
}