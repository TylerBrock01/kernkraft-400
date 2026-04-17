import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '../auth/roles/roles';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { PlanGuard } from '../auth/guards/plan.guard';
import { ActiveUser } from '../auth/classes/active-user.class';

@Controller('analytics')
@Roles(Role.SUPER_ADMIN,Role.ADMIN) // La analítica suele ser solo para el dueño
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.PRO)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly-snapshot')
  async getWeekly(@GetUser() user: ActiveUser) {
    return this.analyticsService.getWeeklySnapshot(user);
  }
  @Get('investor')
  getInvestorMetrics(@GetUser() user: ActiveUser) {
    return this.analyticsService.getInvestorMetrics(user);
  }

  @Get('daily-revenue')
  async getDailyRevenue(@GetUser() user: ActiveUser) {
    // Obtenemos la suma
    const total = await this.analyticsService.getDailyRevenue(user);

    // Lo mandamos en un JSON limpio
    return {
      date: new Date().toISOString(),
      revenue: total
    };
  }

  @Get('financial-pulse')
  async getDailyFinancialPulse(@GetUser() user: ActiveUser) {
    // 1. Aislamiento Multi-Tenant (SaaS):
    // Le pasamos estrictamente el businessId del usuario logueado para que
    // la frutería jamás pueda ver los números de la agencia de rentas.
    const pulseData = await this.analyticsService.getCompleteFinancialPulse(user);

    // 2. Empaquetado Limpio para el Frontend
    return {
      timestamp: new Date().toISOString(),
      businessId: user.businessId,
      data: pulseData // Aquí va { revenue, operatingExpenses, waste, netProfit }
    };
  }
}
