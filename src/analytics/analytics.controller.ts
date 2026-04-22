import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
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
import type { Response } from 'express'; // 👈 ESTA ES LA CLAVE
export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Controller('analytics')
@Roles(Role.SUPER_ADMIN,Role.ADMIN) // La analítica suele ser solo para el dueño
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.PRO)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('financial-pulse')
  async getFinancialPulse(
    @GetUser() user: ActiveUser,
    @Query('period') period?: Timeframe,
  ) {
    const timeframe = period || 'daily'; // Default a Hoy

    const pulseData = await this.analyticsService.getFinancialPulse(
      user.businessId,
      timeframe
    );

    return {
      timestamp: new Date().toISOString(),
      businessId: user.businessId,
      period: timeframe,
      data: pulseData
    };
  }

  // 🕯️ 2. VOLATILIDAD Y VELAS JAPONESAS (OHLC)
  @Get('ohlc')
  async getOHLC(
    @GetUser() user: ActiveUser,
    @Query('period') period?: Timeframe,
  ) {
    const timeframe = period || 'daily';

    const ohlcData = await this.analyticsService.getOHLC(
      user.businessId,
      timeframe
    );

    return {
      businessId: user.businessId,
      period: timeframe,
      data: ohlcData
    };
  }

  // 💼 3. MÉTRICAS MACRO (Solo para el Dueño)
  @Get('investor')
  async getInvestorMetrics(@GetUser() user: ActiveUser) {
    return this.analyticsService.getInvestorMetrics(user.businessId);
  }

  @Get('export/csv')
  async downloadCsv(@GetUser() user: ActiveUser, @Res() res: Response) {
    const csvData = await this.analyticsService.exportTransactionsToCsv(user.businessId);

    const fileName = `reporte_caza_${new Date().toISOString().split('T')[0]}.csv`;

    // Configuramos el "attachment" para forzar la descarga
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.status(200).send(csvData);
  }

}
