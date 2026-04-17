import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';
import { ActiveUser } from '../auth/classes/active-user.class';

@Controller('cash-movements')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.STARTER)
export class CashMovementsController {
  constructor(private readonly cashMovementsService: CashMovementsService) {}

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Post()
  create(@Body() createDto: CreateCashMovementDto, @GetUser() user: ActiveUser) {
    return this.cashMovementsService.create(createDto, user);
  }

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Get('my-shift')
  getMyShiftMovements(@GetUser() user: User) {
    return this.cashMovementsService.getMyShiftMovements(user);
  }

  // 🛡️ Solo el Administrador puede ver el historial completo de la empresa
  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @GetUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashMovementsService.findAll(user, page, limit, startDate, endDate);
  }
}