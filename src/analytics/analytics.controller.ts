import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '../auth/roles/roles';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { PlanGuard } from '../auth/guards/plan.guard';

@Controller('analytics')
@Roles(Role.SUPER_ADMIN,Role.ADMIN) // La analítica suele ser solo para el dueño
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.ZENITH)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly-snapshot')
  async getWeekly(@GetUser() user: User) {
    return this.analyticsService.getWeeklySnapshot(user);
  }
  @Get('investor')
  getInvestorMetrics(@GetUser() user: User) {
    return this.analyticsService.getInvestorMetrics(user);
  }
}
