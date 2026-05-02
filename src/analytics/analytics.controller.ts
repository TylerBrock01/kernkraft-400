import { Controller, Get, Query, Res, UseGuards, Headers } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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
    @Headers('x-timezone') clientTimezone?: string, // 👈 ATRAPAMOS LA ZONA
  ) {
    const timeframe = period || 'daily';
    const timezone = clientTimezone || 'America/Tijuana'; // 🛡️ Fallback

    const pulseData = await this.analyticsService.getFinancialPulse(
      user.businessId,
      timeframe,
      timezone // 👈 SE LA PASAMOS AL SERVICIO
    );

    return {
      timestamp: new Date().toISOString(),
      businessId: user.businessId,
      period: timeframe,
      timezone: timezone, // Para depuración en el frontend
      data: pulseData
    };
  }

  // 🕯️ 2. VOLATILIDAD Y VELAS JAPONESAS (OHLC)
  @Get('ohlc')
  async getOHLC(
    @GetUser() user: ActiveUser,
    @Query('period') period?: Timeframe,
    @Headers('x-timezone') clientTimezone?: string, // 👈 ATRAPAMOS LA ZONA
  ) {
    const timeframe = period || 'daily';
    const timezone = clientTimezone || 'America/Tijuana'; // 🛡️ Fallback

    const ohlcData = await this.analyticsService.getOHLC(
      user.businessId,
      timeframe,
      timezone // 👈 SE LA PASAMOS AL SERVICIO
    );

    return {
      businessId: user.businessId,
      period: timeframe,
      timezone: timezone,
      data: ohlcData
    };
  }

  // 💼 3. MÉTRICAS MACRO (Solo para el Dueño)
  @Get('investor')
  async getInvestorMetrics(
    @GetUser() user: ActiveUser,
    @Headers('x-timezone') clientTimezone?: string, // 👈 ATRAPAMOS LA ZONA
  ) {
    const timezone = clientTimezone || 'America/Tijuana'; // 🛡️ Fallback

    return this.analyticsService.getInvestorMetrics(
      user.businessId,
      timezone // 👈 SE LA PASAMOS AL SERVICIO
    );
  }

  // 🖨️ 4. EXPORTACIÓN A CSV
  @Get('export/csv')
  async downloadCsv(
    @GetUser() user: ActiveUser,
    @Res() res: Response,
    @Headers('x-timezone') clientTimezone?: string, // 👈 ATRAPAMOS LA ZONA
  ) {
    const timezone = clientTimezone || 'America/Tijuana'; // 🛡️ Fallback

    const csvData = await this.analyticsService.exportTransactionsToCsv(
      user.businessId,
      timezone // 👈 SE LA PASAMOS AL SERVICIO
    );

    const fileName = `reporte_caza_${new Date().toISOString().split('T')[0]}.csv`;

    // Configuramos el "attachment" para forzar la descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); // charset=utf-8 por los acentos
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.status(200).send(csvData);
  }
}
