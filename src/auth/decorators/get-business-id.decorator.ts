// src/auth/decorators/get-business-id.decorator.ts
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetBusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.businessId) {
      throw new InternalServerErrorException('Business ID no encontrado en la petición (¿Olvidaste el JwtAuthGuard?)');
    }

    return user.businessId;
  },
);