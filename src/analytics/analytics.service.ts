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

  async getInvestorMetrics(user: User) {
    const { businessId } = user;
    const now = new Date();

    // 🗓️ 1. MATEMÁTICA DE CALENDARIO
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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

    const currentRevenue = parseFloat(currentMonthStats.revenue || 0);
    const previousRevenue = parseFloat(previousMonthStats.revenue || 0);

    // 🧮 4. FÓRMULA FINANCIERA DEL MoM
    let growthPercentage = 0;
    if (previousRevenue > 0) {
      growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (currentRevenue > 0) {
      growthPercentage = 100;
    }

    // --- 🏆 NUEVO BLOQUE: RENDIMIENTO POR ACTIVO (ROI) ---
    // 5. Buscamos los 5 productos que más dinero han metido a la caja históricamente
    const topAssets = await this.contentRepository
      .createQueryBuilder('tc')
      .leftJoin('tc.transaction', 't')
      .leftJoin('tc.product', 'p')
      .select('p.id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('p.price', 'currentPrice')
      .addSelect('SUM(tc.quantity)', 'timesRentedOrSold')
      .addSelect('SUM(tc.quantity * tc.price)', 'grossRevenue')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.price')
      .orderBy('"grossRevenue"', 'DESC')
      .limit(5)
      .getRawMany();

    // 6. Cruzamos esos productos estrella contra sus mermas para saber la ganancia real
    const assetPerformance = await Promise.all(topAssets.map(async (asset) => {
      const mermas = await this.adjustmentRepository
        .createQueryBuilder('sa')
        .select('SUM(sa.quantity)', 'lostUnits')
        .where('sa.businessId = :businessId', { businessId })
        .andWhere('sa.productId = :productId', { productId: asset.productId })
        .getRawOne();

      const lostUnits = parseInt(mermas.lostUnits || 0);
      const gross = parseFloat(asset.grossRevenue);
      const lossValue = lostUnits * parseFloat(asset.currentPrice); // Lo que nos costó perderlos
      const netRevenue = gross - lossValue; // El dinero verdaderamente libre

      return {
        product: asset.productName,
        utilization: {
          timesRentedOrSold: parseInt(asset.timesRentedOrSold),
          unitsLostToDamage: lostUnits
        },
        financials: {
          grossRevenue: gross,       // Dinero que entró
          lossValue: lossValue,      // Dinero que perdimos en mermas
          netRevenue: netRevenue     // Ganancia real del producto
        }
      };
    }));
    // ... aquí termina tu código de assetPerformance ...

    // --- 👥 NUEVO BLOQUE: VALOR DEL CLIENTE (LTV) ---
    // 7. Buscamos a los clientes más valiosos de todos los tiempos (Top 3)
    const topCustomers = await this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.customer', 'c') // Usamos la relación que creaste en la entidad
      .select('c.name', 'customerName')
      .addSelect('SUM(t.total)', 'totalSpent')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.customerId IS NOT NULL') // Excluimos ventas anónimas de chicles
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('"totalSpent"', 'DESC')
      .limit(3)
      .getRawMany();

    // 8. Calculamos qué porcentaje de las ventas viene de clientes registrados
    const allTimeStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalRevenue')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    const identifiedStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalIdentified')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.customerId IS NOT NULL')
      .getRawOne();

    const totalAllTime = parseFloat(allTimeStats.totalRevenue || 0);
    const totalIdentified = parseFloat(identifiedStats.totalIdentified || 0);

    // Si la mayoría del dinero es anónimo, el porcentaje será bajito.
    // Si casi todo es por renta de equipo pesado a clientes, rozará el 100%.
    const loyaltyPercentage = totalAllTime > 0 ? (totalIdentified / totalAllTime) * 100 : 0;

    const customerInsights = {
      loyaltyPercentage: parseFloat(loyaltyPercentage.toFixed(2)),
      topClients: topCustomers.map(c => ({
        name: c.customerName,
        totalSpent: parseFloat(c.totalSpent),
        transactionCount: parseInt(c.transactionCount)
      }))
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // 🚀 RETORNO FINAL DEL PANEL
    return {
      businessId,
      kpis: {
        growthMoM: {
          label: 'Crecimiento Mes a Mes',
          currentMonth: { label: monthNames[now.getMonth()], revenue: currentRevenue },
          previousMonth: { label: monthNames[startOfPreviousMonth.getMonth()], revenue: previousRevenue },
          growth: {
            percentage: parseFloat(growthPercentage.toFixed(2)),
            trend: growthPercentage >= 0 ? 'UP' : 'DOWN',
            isPositive: growthPercentage >= 0
          }
        },
        assetPerformance: assetPerformance, // 👈 Aquí inyectamos el ROI
        customerInsights: customerInsights
      }
    };
  }

}