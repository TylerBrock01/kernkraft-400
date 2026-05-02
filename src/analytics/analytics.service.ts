// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Transaction, TransactionContent, TransactionStatus } from '../transactions/entities/transaction.entity';
import { StockAdjustment } from '../stock-adjustments/entities/stock-adjustment.entity';
import { CashMovement, CashMovementCategory, CashMovementType } from '../cash-movements/entities/cash-movement.entity';
import { Timeframe } from './analytics.controller';
import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

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

  private getDateBoundaries(period: Timeframe, timeZone: string): { startDate: Date; endDate: Date } {
    const serverNow = new Date(); // Esto está en UTC si estás en la nube

    // Convertimos el "ahora" del servidor a la hora exacta del usuario en su ciudad
    const localNow = toZonedTime(serverNow, timeZone);
    let localStart = new Date(localNow);

    switch (period) {
      case 'daily':
        localStart.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        localStart.setDate(localNow.getDate() - 7);
        localStart.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        localStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
        break;
      case 'yearly':
        localStart = new Date(localNow.getFullYear(), 0, 1);
        break;
    }

    // Convertimos esa hora local de regreso a UTC para que la base de datos lo entienda
    const startDate = fromZonedTime(localStart, timeZone);
    const endDate = serverNow; // El fin siempre es "este instante exacto"

    return { startDate, endDate };
  }

// 🛡️ 2. ACTUALIZAMOS EL PULSE PARA QUE PASE LA ZONA HORARIA
  async getFinancialPulse(businessId: string, period: Timeframe, timezone: string) {
    // 👈 Usamos el timezone aquí
    const { startDate, endDate } = this.getDateBoundaries(period, timezone);

    // ... (El resto de tu código de getFinancialPulse se queda EXACTAMENTE IGUAL) ...
    const transactions = await this.transactionRepository.find({
      where: {
        businessId,
        status: In([
          TransactionStatus.COMPLETED,
          TransactionStatus.PARTIAL,
          TransactionStatus.PAID,
          TransactionStatus.PENDING
        ]),
        transactionDate: Between(startDate, endDate),
      },
    });

    let revenue = 0;
    let heldDeposits = 0; // 👈 NUEVO: El dinero intocable

    transactions.forEach(t => {
      const totalFisicoPagado = Number(t.amountPaid || 0);
      const deposito = Number(t.depositAmount || 0);

      // Contablemente, el depósito se cobra primero para asegurar el equipo.
      // Lo que sobra es la verdadera ganancia (Ingreso Bruto)
      const ingresoReal = Math.max(0, totalFisicoPagado - deposito);
      revenue += ingresoReal;

      // Si la transacción tiene un depósito y no ha sido devuelto (REFUNDED),
      // lo sumamos a nuestra bolsa de dinero retenido.
      if (deposito > 0 && t.status !== TransactionStatus.REFUNDED) {
        heldDeposits += deposito;
      }
    });
    // --------------------------------------------------------
    // 2. EXTRACCIÓN DE GASTOS Y MERMAS DE EFECTIVO
    // --------------------------------------------------------
    const movements = await this.cashMovementRepository.find({
      where: {
        businessId,
        type: In([CashMovementType.OUT, CashMovementType.IN]),
        date: Between(startDate, endDate),
      }
    });

    let operatingExpenses = 0;
    let cashWaste = 0; // Renombrado para mayor claridad
    let deposit = 0;
    movements.forEach(m => {
      if (m.category === CashMovementCategory.OPERATING_EXPENSE) {
        operatingExpenses += Number(m.amount);
      } else if (m.category === CashMovementCategory.WASTE_LOSS) {
        cashWaste += Number(m.amount);
      } else if (m.category === CashMovementCategory.DEPOSIT_REFUND) {
        revenue -= Number(m.amount);
      }else if (m.category === CashMovementCategory.DEPOSIT) {
        deposit += Number(m.amount);
      }
    });

    // --------------------------------------------------------
    // 3. EXTRACCIÓN DE MERMAS FÍSICAS (El Inventario Destruido)
    // --------------------------------------------------------
    // Traemos los ajustes de inventario que representan pérdidas
    const stockAdjustments = await this.adjustmentRepository.find({
      where: {
        businessId,
        // IMPORTANTE: Asegúrate de que el campo de fecha coincida con tu entidad (puede ser 'date' o 'createdAt')
        createdAt: Between(startDate, endDate),
        // type: 'LOSS' // 👈 Descomenta si tienes un Enum para diferenciar pérdidas de "entradas por inventario"
      },
      relations: ['product'] // 👈 CRÍTICO: Necesitamos el producto para saber cuánto dinero se perdió
    });

    let inventoryWaste = 0;

    stockAdjustments.forEach(adj => {
      // Multiplicamos la cantidad perdida por el precio del producto
      // Usamos Math.abs() por si guardas los ajustes como números negativos (ej. -2)
      const costOfLostItem = Math.abs(Number(adj.quantity)) * Number(adj.product.price);
      inventoryWaste += costOfLostItem;
    });

    // --------------------------------------------------------
    // 4. EL CÁLCULO FINAL (La Utilidad Real)
    // --------------------------------------------------------
    // Sumamos la merma de billetes (robos/faltantes) + merma de productos
    const totalWaste = cashWaste + inventoryWaste;
    const netProfit = revenue - operatingExpenses - totalWaste;

    return {
      revenue,
      operatingExpenses,
      waste: totalWaste, // 👈 Mandamos el total combinado al Frontend
      netProfit,
      heldDeposits
    };
  }

  async getInvestorMetrics(businessId: string, timezone: string) {
    const serverNow = new Date();

    // 1. Convertimos el "Ahora" del servidor a la hora de la ciudad del cliente
    const localNow = toZonedTime(serverNow, timezone);

    // 2. MATEMÁTICA DE CALENDARIO EN HORA LOCAL
    const localStartOfCurrentMonth = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    const localStartOfPreviousMonth = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
    const localEndOfPreviousMonth = new Date(localNow.getFullYear(), localNow.getMonth(), 0, 23, 59, 59, 999);

    // 3. Regresamos las fechas a UTC para que la Base de Datos las entienda
    const startOfCurrentMonth = fromZonedTime(localStartOfCurrentMonth, timezone);
    const startOfPreviousMonth = fromZonedTime(localStartOfPreviousMonth, timezone);
    const endOfPreviousMonth = fromZonedTime(localEndOfPreviousMonth, timezone);

    const validStatuses = ['COMPLETED', 'PARTIAL', 'PAID', 'PENDING'];

    // 📊 EXTRACCIÓN DE DATOS (Ingresos)
    const revenueStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select(`
      SUM(CASE WHEN t.transactionDate >= :startCurrent THEN t.total ELSE 0 END) as curr_revenue,
      SUM(CASE WHEN t.transactionDate >= :startPrev AND t.transactionDate <= :endPrev THEN t.total ELSE 0 END) as prev_revenue
    `)
      .setParameters({
        startCurrent: startOfCurrentMonth,
        startPrev: startOfPreviousMonth,
        endPrev: endOfPreviousMonth
      })
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status IN (:...statuses)', { statuses: validStatuses })
      .getRawOne();

    const currentRevenue = parseFloat(revenueStats.curr_revenue || 0);
    const previousRevenue = parseFloat(revenueStats.prev_revenue || 0);

    // 🧮 FÓRMULA FINANCIERA DEL MoM
    let growthPercentage = 0;
    if (previousRevenue > 0) {
      growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (currentRevenue > 0) {
      growthPercentage = 100;
    }

    // --- 🏆 RENDIMIENTO POR ACTIVO (ROI) ---
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
      .andWhere('t.status IN (:...statuses)', { statuses: validStatuses })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.price')
      .orderBy('"grossRevenue"', 'DESC')
      .limit(5)
      .getRawMany();

    let assetPerformance = [];

    if (topAssets.length > 0) {
      const topAssetIds = topAssets.map(a => a.productId);

      const mermasData = await this.adjustmentRepository
        .createQueryBuilder('sa')
        .select('sa.productId', 'productId')
        .addSelect('SUM(sa.quantity)', 'lostUnits')
        .where('sa.businessId = :businessId', { businessId })
        .andWhere('sa.productId IN (:...topAssetIds)', { topAssetIds })
        .groupBy('sa.productId')
        .getRawMany();

      const mermasMap = new Map(mermasData.map(m => [m.productId, parseInt(m.lostUnits || 0)]));

      assetPerformance = topAssets.map(asset => {
        const lostUnits = mermasMap.get(asset.productId) || 0;
        const gross = parseFloat(asset.grossRevenue);
        const lossValue = lostUnits * parseFloat(asset.currentPrice);

        return {
          product: asset.productName,
          utilization: {
            timesRentedOrSold: parseInt(asset.timesRentedOrSold),
            unitsLostToDamage: lostUnits
          },
          financials: {
            grossRevenue: gross,
            lossValue: lossValue,
            netRevenue: gross - lossValue
          }
        };
      });
    }

    // --- 👥 VALOR DEL CLIENTE (LTV) ---
    const topCustomers = await this.transactionRepository
      .createQueryBuilder('t')
      .leftJoin('t.customer', 'c')
      .select('c.name', 'customerName')
      .addSelect('SUM(t.total)', 'totalSpent')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status IN (:...statuses)', { statuses: validStatuses })
      .andWhere('t.customerId IS NOT NULL')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('"totalSpent"', 'DESC')
      .limit(3)
      .getRawMany();

    const globalStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalAllTime')
      .addSelect('SUM(CASE WHEN t.customerId IS NOT NULL THEN t.total ELSE 0 END)', 'totalIdentified')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status IN (:...statuses)', { statuses: validStatuses })
      .getRawOne();

    const totalAllTime = parseFloat(globalStats.totalAllTime || 0);
    const totalIdentified = parseFloat(globalStats.totalIdentified || 0);
    const loyaltyPercentage = totalAllTime > 0 ? (totalIdentified / totalAllTime) * 100 : 0;

    const customerInsights = {
      loyaltyPercentage: parseFloat(loyaltyPercentage.toFixed(2)),
      topClients: topCustomers.map(c => ({
        name: c.customerName,
        totalSpent: parseFloat(c.totalSpent),
        transactionCount: parseInt(c.transactionCount)
      }))
    };

    // --- 🏦 GASTOS OPERATIVOS Y MERMAS ---
    const financialMovements = await this.cashMovementRepository
      .createQueryBuilder('cm')
      .select(`
      SUM(CASE WHEN cm.date >= :startCurrent AND cm.category IN ('OPERATING_EXPENSE', 'WASTE_LOSS') THEN cm.amount ELSE 0 END) as curr_exp,
      SUM(CASE WHEN cm.date >= :startPrev AND cm.date <= :endPrev AND cm.category IN ('OPERATING_EXPENSE', 'WASTE_LOSS') THEN cm.amount ELSE 0 END) as prev_exp,
      SUM(CASE WHEN cm.category IN ('OPERATING_EXPENSE', 'WASTE_LOSS') THEN cm.amount ELSE 0 END) as all_time_exp
    `)
      .setParameters({
        startCurrent: startOfCurrentMonth,
        startPrev: startOfPreviousMonth,
        endPrev: endOfPreviousMonth
      })
      .where('cm.businessId = :businessId', { businessId })
      .andWhere('cm.type = :type', { type: 'OUT' })
      .getRawOne();

    const currentExpenses = parseFloat(financialMovements.curr_exp || 0);
    const previousExpenses = parseFloat(financialMovements.prev_exp || 0);
    const allTimeExpenses = parseFloat(financialMovements.all_time_exp || 0);

    const netProfitCurrent = currentRevenue;
    const netProfitPrevious = previousRevenue - previousExpenses;

    const financialHealth = {
      monthlyExpenses: {
        current: currentExpenses,
        previous: previousExpenses,
        label: 'Gastos y Mermas (Operación Total)'
      },
      netProfit: {
        amount: netProfitCurrent,
        previousAmount: netProfitPrevious,
        label: 'Utilidad Neta Real',
        marginPercentage: currentRevenue > 0 ? (netProfitCurrent / currentRevenue) * 100 : 0
      }
    };

    // --- 💸 SALUD DEL FLUJO DE EFECTIVO ---
    const retainedCapitalStats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.depositAmount)', 'retainedAmount')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.rentalStatus IN (:...rStatuses)', { rStatuses: ['OUT', 'UNFULFILLED'] })
      .getRawOne();

    const retainedCapital = parseFloat(retainedCapitalStats.retainedAmount || 0);
    const trueFreeCapital = totalAllTime;

    const cashFlowHealth = {
      retainedCapital: retainedCapital,
      freeCapitalAllTime: trueFreeCapital - allTimeExpenses,
      physicalCashInBusiness: trueFreeCapital
    };

    // Nombres de los meses localizados en español
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return {
      businessId,
      kpis: {
        growthMoM: {
          label: 'Crecimiento Mes a Mes',
          currentMonth: { label: monthNames[localNow.getMonth()], revenue: currentRevenue }, // Mes Local
          previousMonth: { label: monthNames[localStartOfPreviousMonth.getMonth()], revenue: previousRevenue }, // Mes Local
          growth: {
            percentage: parseFloat(growthPercentage.toFixed(2)),
            trend: growthPercentage >= 0 ? 'UP' : 'DOWN',
            isPositive: growthPercentage >= 0
          }
        },
        assetPerformance,
        customerInsights,
        cashFlowHealth,
        financialHealth,
      }
    };
  }

  async exportTransactionsToCsv(businessId: string, timezone: string): Promise<string> {
    const transactions = await this.transactionRepository.find({
      where: {
        businessId,
        status: TransactionStatus.COMPLETED
      },
      order: { transactionDate: 'DESC' },
      relations: ['customer', 'user', 'contents', 'contents.product']
    });

    const header = [
      'Fecha',
      'Ticket',
      'Cajero',
      'Cliente',
      'Tipo de Operación',
      'Estado (Renta)',
      'Fecha Devolución',
      'Artículos Entregados',
      'Método Pago',
      'Cupón Aplicado',
      'Descuento ($)',
      'Depósito Retenido ($)',
      'Cobro Total ($)',
      'Utilidad Libre ($)'
    ].join(',');

    const rows = transactions.map(t => {
      // 🛡️ FIX: Formateamos la fecha en la zona horaria del cliente (Ej: '2026-05-01')
      const localDate = toZonedTime(t.transactionDate, timezone);
      const date = format(localDate, 'yyyy-MM-dd');

      let returnDate = 'N/A';
      if (t.returnDate) {
        const localReturn = toZonedTime(t.returnDate, timezone);
        returnDate = format(localReturn, 'yyyy-MM-dd');
      }

      const shortTicket = t.uuid.split('-')[0].toUpperCase();
      const cashier = t.user?.name || 'Sistema';
      const customer = t.customer?.name || 'Público General';

      const itemsString = t.contents
        .map(c => `${c.quantity}x ${c.product?.name || 'Art. Desconocido'}`)
        .join(' | ');

      const total = Number(t.total);
      const deposit = Number(t.depositAmount || 0);
      const discount = Number(t.couponDiscount || 0);
      const realRevenue = total - deposit;

      return [
        date,
        shortTicket,
        `"${cashier}"`,
        `"${customer}"`,
        t.type,
        t.rentalStatus || 'N/A',
        returnDate,
        `"${itemsString}"`,
        t.paymentMethod,
        t.coupon || 'Ninguno',
        discount.toFixed(2),
        deposit.toFixed(2),
        total.toFixed(2),
        realRevenue.toFixed(2)
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async getOHLC(businessId: string, period: Timeframe, timezone: string) {
    // Asegúrate de que getDateBoundaries ahora reciba y use el timezone (como acordamos antes)
    const { startDate, endDate } = this.getDateBoundaries(period, timezone);

    const transactions = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.transactionDate', 'date')
      .addSelect('(t.amountPaid - COALESCE(t.depositAmount, 0))', 'netTicket')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status IN (:...statuses)', {
        statuses: [
          TransactionStatus.COMPLETED,
          TransactionStatus.PARTIAL,
          TransactionStatus.PAID,
          TransactionStatus.PENDING
        ]
      })
      .andWhere('t.transactionDate >= :startDate AND t.transactionDate <= :endDate', {
        startDate,
        endDate
      })
      .orderBy('t.transactionDate', 'ASC')
      .getRawMany();

    const ohlcMap = new Map<string, any>();

    for (const t of transactions) {
      // 🛡️ FIX: Convertimos la hora UTC de Postgres a la hora local del usuario
      const localDate = toZonedTime(new Date(t.date), timezone);
      let timeKey = '';

      // Agrupamos usando el reloj local del cliente, no el de la nube
      if (period === 'daily') {
        timeKey = format(localDate, "yyyy-MM-dd'T'HH:00:00.000XXX"); // Ejemplo: 2026-05-01T21:00:00.000-07:00
      } else if (period === 'yearly') {
        timeKey = format(localDate, 'yyyy-MM'); // Agrupa por mes local
      } else {
        timeKey = format(localDate, 'yyyy-MM-dd'); // Agrupa por día local
      }

      const ticketValue = Math.max(0, parseFloat(t.netTicket));

      if (!ohlcMap.has(timeKey)) {
        ohlcMap.set(timeKey, {
          date: timeKey,
          open: ticketValue,
          high: ticketValue,
          low: ticketValue,
          close: ticketValue,
          volume: 1
        });
      } else {
        const candle = ohlcMap.get(timeKey);
        if (ticketValue > candle.high) candle.high = ticketValue;
        if (ticketValue < candle.low) candle.low = ticketValue;
        candle.close = ticketValue;
        candle.volume += 1;
      }
    }

    return Array.from(ohlcMap.values());
  }
}