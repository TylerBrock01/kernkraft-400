// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';
import { AdjustmentReason, StockAdjustment } from '../stock-adjustments/entities/stock-adjustment.entity';
import { CashMovement, CashMovementType } from '../cash-movements/entities/cash-movement.entity';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent)
    private readonly contentRepository: Repository<TransactionContent>,
    @InjectRepository(StockAdjustment) // 🛡️ Inyectamos las mermas
    private readonly adjustmentRepository: Repository<StockAdjustment>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
  ) {}

  async getWeeklySnapshot(user: ActiveUser) {
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

  async getInvestorMetrics(user: ActiveUser) {
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
    // 5. Buscamos los 5 productos estrella
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

    let assetPerformance = [];

    if (topAssets.length > 0) {
      // 6. 🛡️ CORRECCIÓN N+1: Extraemos los IDs y hacemos UNA SOLA consulta de mermas
      const topAssetIds = topAssets.map(a => a.productId);

      const mermasData = await this.adjustmentRepository
        .createQueryBuilder('sa')
        .select('sa.productId', 'productId')
        .addSelect('SUM(sa.quantity)', 'lostUnits')
        .where('sa.businessId = :businessId', { businessId })
        .andWhere('sa.productId IN (:...topAssetIds)', { topAssetIds })
        .groupBy('sa.productId')
        .getRawMany();

      // Convertimos las mermas en un diccionario (Mapa) para búsqueda instantánea
      const mermasMap = new Map(
        mermasData.map(m => [m.productId, parseInt(m.lostUnits || 0)])
      );

      // Cruzamos los datos en memoria de forma instantánea
      assetPerformance = topAssets.map(asset => {
        const lostUnits = mermasMap.get(asset.productId) || 0; // Buscamos en el mapa, no en la BD
        const gross = parseFloat(asset.grossRevenue);
        const lossValue = lostUnits * parseFloat(asset.currentPrice);
        const netRevenue = gross - lossValue;

        return {
          product: asset.productName,
          utilization: {
            timesRentedOrSold: parseInt(asset.timesRentedOrSold),
            unitsLostToDamage: lostUnits
          },
          financials: {
            grossRevenue: gross,
            lossValue: lossValue,
            netRevenue: netRevenue
          }
        };
      });
    }

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

    // --- 🏦 NUEVO BLOQUE: GASTOS OPERATIVOS Y UTILIDAD NETA ---
    // 10. Consultamos gastos (OUT) del mes actual y anterior
    const operatingExpenses = await this.cashMovementRepository
      .createQueryBuilder('cm')
      .select(`
        SUM(CASE WHEN cm.date >= :startCurrent AND cm.type = 'OUT' THEN cm.amount ELSE 0 END) as current_expenses,
        SUM(CASE WHEN cm.date >= :startPrev AND cm.date <= :endPrev AND cm.type = 'OUT' THEN cm.amount ELSE 0 END) as previous_expenses
      `)
      .setParameters({
        startCurrent: startOfCurrentMonth,
        startPrev: startOfPreviousMonth,
        endPrev: endOfPreviousMonth
      })
      .where('cm.businessId = :businessId', { businessId })
      .getRawOne();

    const currentExpenses = parseFloat(operatingExpenses.current_expenses || 0);
    const previousExpenses = parseFloat(operatingExpenses.previous_expenses || 0);

    // 11. MATEMÁTICA FINAL: Utilidad Neta (Lo que realmente va al bolsillo)
    // 11. 🛡️ CORRECCIÓN MATEMÁTICA: Utilidad Neta y Crecimiento Real
    const netProfitCurrent = currentRevenue - currentExpenses;
    const netProfitPrevious = previousRevenue - previousExpenses;

    let netProfitGrowth = 0;
    if (netProfitPrevious !== 0) {
      // Usamos Math.abs en el divisor para que la transición de números rojos a verdes se calcule bien
      netProfitGrowth = ((netProfitCurrent - netProfitPrevious) / Math.abs(netProfitPrevious)) * 100;
    } else if (netProfitPrevious === 0 && netProfitCurrent > 0) {
      netProfitGrowth = 100;
    } else if (netProfitPrevious === 0 && netProfitCurrent < 0) {
      netProfitGrowth = -100; // Si no ganaban nada y ahora pierden
    }

    const financialHealth = {
      monthlyExpenses: {
        current: currentExpenses,
        previous: previousExpenses,
        label: 'Gastos Operativos (Luz, Renta, Insumos)'
      },
      netProfit: {
        amount: netProfitCurrent,
        previousAmount: netProfitPrevious,
        label: 'Utilidad Neta Real',
        marginPercentage: currentRevenue > 0 ? (netProfitCurrent / currentRevenue) * 100 : 0
      }
    };
    // --- 💸 NUEVO BLOQUE: SALUD DEL FLUJO DE EFECTIVO ---
    // 9. Calculamos cuánto dinero en caja NO es del negocio (Depósitos retenidos)
    const retainedCapitalStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.depositAmount)', 'retainedAmount')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.rentalStatus = :status', { status: 'OUT' }) // 👈 Solo las rentas activas
      .getRawOne();

    const retainedCapital = parseFloat(retainedCapitalStats.retainedAmount || 0);

    // El "Capital Libre" es la suma histórica de ganancias puras (que ya calculamos arriba en totalAllTime)
    // La "Liquidez Actual" es todo el efectivo que físicamente debería existir en las cuentas/cajas del negocio
    const cashFlowHealth = {
      retainedCapital: retainedCapital, // Dinero intocable (se debe regresar)
      freeCapitalAllTime: totalAllTime, // Dinero 100% del negocio (ganancias puras)
      physicalCashInBusiness: retainedCapital + totalAllTime
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
        customerInsights: customerInsights,
        cashFlowHealth: cashFlowHealth,
        financialHealth: financialHealth,
      }
    };
  }

  async getDailyRevenue(user: ActiveUser){
    const { businessId } = user;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      // ✨ LA MAGIA CONTABLE: (Total - Depósito)
      // Usamos COALESCE por si depositAmount es nulo en ventas directas
      .select('SUM(transaction.total - COALESCE(transaction.depositAmount, 0))', 'dailyTotal')
      .where('transaction.businessId = :businessId', { businessId })
      // ✨ CORRECCIÓN DE COLUMNA: Usamos transactionDate
      .andWhere('transaction.transactionDate BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd
      })
      .andWhere('transaction.status = :validStatus', {
        validStatus: 'COMPLETED' // Asumiendo que TransactionStatus.COMPLETED es el string 'COMPLETED'
      })
      .getRawOne();

    return Number(result.dailyTotal || 0);
  }

  async getCompleteFinancialPulse(user: ActiveUser) {
    const { businessId } = user;

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    // 1. INGRESOS (Ventas puras, sin depósitos)
    const revenueQuery = this.transactionRepository.createQueryBuilder('tx')
      .select('SUM(tx.total - COALESCE(tx.depositAmount, 0))', 'total')
      .where('tx.businessId = :businessId AND tx.transactionDate BETWEEN :start AND :end', { businessId, start, end })
      .andWhere('tx.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    // 2. GASTOS OPERATIVOS (Solo el dinero que nos cuesta operar)
    const expensesQuery = this.cashMovementRepository.createQueryBuilder('cm')
      .select('SUM(cm.amount)', 'total')
      .where('cm.businessId = :businessId AND cm.date BETWEEN :start AND :end', { businessId, start, end })
      .andWhere('cm.type = :type', { type: CashMovementType.OUT })
      // ✨ EL ESCUDO CONTABLE: Filtramos para que NO cuente la devolución de depósitos
      .andWhere('cm.category = :category', { category: 'OPERATING_EXPENSE' })
      .getRawOne();

    // 3. MERMAS FINANCIERAS (El costo de lo que perdimos)
    const wasteQuery = this.adjustmentRepository.createQueryBuilder('adj')
      .leftJoin('adj.product', 'product')
      .select('SUM(adj.quantity * product.price)', 'totalValue')
      .where('adj.businessId = :businessId AND adj.createdAt BETWEEN :start AND :end', { businessId, start, end })
      .andWhere('adj.reason IN (:...lossReasons)', {
        lossReasons: [
          AdjustmentReason.DAMAGE,
          AdjustmentReason.THEFT,
          AdjustmentReason.EXPIRATION,
          AdjustmentReason.LOSS
        ]
      })
      .getRawOne();

    // 4. Ejecutamos Promesas en paralelo
    const [rev, exp, wst] = await Promise.all([revenueQuery, expensesQuery, wasteQuery]);

    // 5. Limpieza de datos
    const revenue = Number(rev?.total || 0);
    const operatingExpenses = Number(exp?.total || 0);
    const wasteValue = Number(wst?.totalValue || 0);

    // 6. 💰 GANANCIA LIBRE REAL
    const netProfit = revenue - operatingExpenses - wasteValue;

    return {
      timestamp: new Date().toISOString(),
      revenue,
      operatingExpenses,
      waste: wasteValue,
      netProfit
    };
  }
}