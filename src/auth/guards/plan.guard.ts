import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from '../decorators/require-plan.decorator';
import { SubscriptionPlan } from '../../business/entities/business.entity';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Buscamos si la ruta requiere algún plan específico
    const requiredPlan = this.reflector.getAllAndOverride<SubscriptionPlan>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true; // Si no hay decorador, la ruta es pública para todos los planes
    }

    // 2. Extraemos el usuario (su plan viene tatuado en el JWT)
    const { user } = context.switchToHttp().getRequest();

    // 3. LA JERARQUÍA (El corazón matemático del guard)
    const planHierarchy = {
      [SubscriptionPlan.GENESIS]: 1,
      [SubscriptionPlan.MOTOR]: 2,
      [SubscriptionPlan.ZENITH]: 3,
    };

    const userPlanLevel = planHierarchy[user.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    // 4. El Veredicto
    if (userPlanLevel < requiredPlanLevel) {
      throw new ForbiddenException(
        `⛔ Tu plan actual (${user.plan}) no soporta esta característica. Haz upgrade a ${requiredPlan} para desbloquearla.`
      );
    }

    return true;
  }
}