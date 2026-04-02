// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';
import { StockAdjustment } from '../stock-adjustments/entities/stock-adjustment.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent)
    private readonly contentRepository: Repository<TransactionContent>,
    @InjectRepository(StockAdjustment) // 🛡️ Inyectamos las mermas
    private readonly adjustmentRepository: Repository<StockAdjustment>,
  ) {}

  async getWeeklySnapshot(user: User) {
    const { businessId } = user;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // --- 📊 BLOQUE 1: INGRESOS (VENTAS Y RENTAS) ---
    const stats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalSales')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .addSelect('AVG(t.total)', 'averageTicket')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :sevenDaysAgo', { sevenDaysAgo })
      .getRawOne();

    // --- 📉 BLOQUE 2: PÉRDIDAS (MERMAS DE INVENTARIO) ---
    // Calculamos el costo aproximado de los artículos dados de baja
    const losses = await this.adjustmentRepository
      .createQueryBuilder('sa')
      .leftJoin('sa.product', 'p')
      .select('SUM(sa.quantity * p.price)', 'totalLossValue')
      .addSelect('COUNT(sa.id)', 'lossEvents')
      .where('sa.businessId = :businessId', { businessId })
      .andWhere('sa.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getRawOne();

    // --- 🏆 BLOQUE 3: TOP 3 PRODUCTOS ---
    const topProducts = await this.contentRepository
      .createQueryBuilder('tc')
      .leftJoin('tc.product', 'p')
      .leftJoin('tc.transaction', 't')
      .select('p.name', 'name')
      .addSelect('SUM(tc.quantity)', 'totalSold')
      .addSelect('SUM(tc.quantity * tc.price)', 'totalRevenue')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('p.name')
      .orderBy('"totalSold"', 'DESC')
      .limit(3)
      .getRawMany();

    // --- 🧮 CÁLCULO FINAL PARA EL DUEÑO ---
    const grossRevenue = parseFloat(stats.totalSales || 0);
    const estimatedLoss = parseFloat(losses.totalLossValue || 0);
    const netProfit = grossRevenue - estimatedLoss;

    return {
      period: 'Últimos 7 días',
      businessId,
      financials: {
        grossRevenue, // Lo que entró a la caja
        estimatedLoss, // Lo que costaron los equipos dañados/perdidos
        netProfit, // La ganancia real
        averageTicket: parseFloat(stats.averageTicket || 0).toFixed(2),
        transactionCount: parseInt(stats.transactionCount || 0),
        lossEvents: parseInt(losses.lossEvents || 0),
      },
      topSellers: topProducts.map(p => ({
        product: p.name,
        quantity: parseInt(p.totalSold),
        revenue: parseFloat(p.totalRevenue)
      }))
    };
  }

  // src/analytics/analytics.service.ts

  async getInvestorMetrics(user: User) {
    const { businessId } = user;
    const now = new Date();

    // 🗓️ 1. MATEMÁTICA DE CALENDARIO
    // Mes Actual (Desde el día 1 a las 00:00:00 hasta hoy)
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Mes Anterior (Desde el día 1 del mes pasado hasta el último día del mes pasado)
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 📊 2. EXTRACCIÓN DE DATOS (MES ACTUAL)
    const currentMonthStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'revenue')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :startDate', { startDate: startOfCurrentMonth })
      .getRawOne();

    // 📉 3. EXTRACCIÓN DE DATOS (MES ANTERIOR)
    const previousMonthStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'revenue')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :startDate AND t.transactionDate <= :endDate', {
        startDate: startOfPreviousMonth,
        endDate: endOfPreviousMonth
      })
      .getRawOne();

    // Limpieza de nulos (por si no vendieron nada en todo el mes)
    const currentRevenue = parseFloat(currentMonthStats.revenue || 0);
    const previousRevenue = parseFloat(previousMonthStats.revenue || 0);

    // 🧮 4. FÓRMULA FINANCIERA DEL MoM (Month-over-Month Growth)
    let growthPercentage = 0;

    if (previousRevenue > 0) {
      // Fórmula clásica: ((Nuevo - Viejo) / Viejo) * 100
      growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (currentRevenue > 0) {
      // Si el mes pasado vendieron $0 y este mes vendieron algo, el crecimiento es técnicamente infinito.
      // Para efectos de UI, lo topamos a 100%.
      growthPercentage = 100;
    }

    // Nombres de los meses para el Frontend
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return {
      businessId,
      kpi: 'Month-over-Month Growth (MoM)',
      metrics: {
        currentMonth: {
          label: monthNames[now.getMonth()],
          revenue: currentRevenue
        },
        previousMonth: {
          label: monthNames[startOfPreviousMonth.getMonth()],
          revenue: previousRevenue
        },
        growth: {
          percentage: parseFloat(growthPercentage.toFixed(2)), // Redondeamos a 2 decimales
          trend: growthPercentage >= 0 ? 'UP' : 'DOWN', // Para pintar la flechita verde o roja en el frontend
          isPositive: growthPercentage >= 0
        }
      }
    };
  }
}