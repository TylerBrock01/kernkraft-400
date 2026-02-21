import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../roles/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  // El Reflector es el que permite "leer" los metadatos que pusimos con @Roles
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. ¿Qué roles requiere esta ruta específica?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Mira el método (ej. create)
      context.getClass(),   // Mira el controlador (ej. ProductsController)
    ]);

    // 2. Si la ruta no tiene el decorador @Roles, cualquiera puede pasar
    if (!requiredRoles) {
      return true;
    }

    // 3. Obtenemos al usuario de la petición (inyectado previamente por el JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 4. Lógica de Oro: ¿El rol del usuario está en la lista de roles permitidos?
    // user.role debe venir del JWT que desencriptó Passport
    return requiredRoles.some((role) => user.role === role);
  }
}
