import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../roles/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. ¿Qué roles requiere esta ruta?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Si no hay roles requeridos, pase libre
    if (!requiredRoles) {
      return true;
    }

    // 3. Obtenemos al usuario del JWT
    const { user } = context.switchToHttp().getRequest();

    if (!user) return false;

    // --- LÓGICA DE JERARQUÍA MCU ---

    // REGLA DE ORO 1: El SUPER_ADMIN es Dios.
    // Si el usuario es Super Admin, tiene bypass total en cualquier ruta.
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // REGLA DE ORO 2: Validación de Roles Estándar
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('No tienes el nivel de autoridad necesario para este recurso');
    }

    // REGLA DE ORO 3: Blindaje Multi-tenant (Opcional pero recomendado)
    // Si el usuario es ADMIN o empleado, DEBE tener un businessId.
    if (user.role !== Role.SUPER_ADMIN && !user.businessId) {
      throw new ForbiddenException('Error de identidad: Usuario sin negocio vinculado');
    }

    return true;
  }
}