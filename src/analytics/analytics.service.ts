import { Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';

@Injectable()
export class AnalyticsService {

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent) // 🛡️ Necesitamos esta para el Top
    private readonly contentRepository: Repository<TransactionContent>,
  ) {}

  async getWeeklySnapshot(user: User) {
    const { businessId } = user;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // --- 📊 BLOQUE 1: ESTADÍSTICAS FINANCIERAS ---
    const stats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalSales')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .addSelect('AVG(t.total)', 'averageTicket')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :sevenDaysAgo', { sevenDaysAgo })
      .getRawOne();

    // --- 🏆 BLOQUE 2: TOP 3 PRODUCTOS MÁS VENDIDOS ---
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
      .orderBy('"totalSold"', 'DESC') // Ordenamos por cantidad
      .limit(3)
      .getRawMany();

    return {
      period: 'Últimos 7 días',
      businessId,
      summary: {
        totalSales: parseFloat(stats.totalSales || 0),
        transactionCount: parseInt(stats.transactionCount || 0),
        averageTicket: parseFloat(stats.averageTicket || 0).toFixed(2),
      },
      topSellers: topProducts.map(p => ({
        product: p.name,
        quantity: parseInt(p.totalSold),
        revenue: parseFloat(p.totalRevenue)
      }))
    };
  }

  create(createAnalyticsDto: CreateAnalyticsDto) {
    return 'This action adds a new analytics';
  }

  findAll() {
    return `This action returns all analytics`;
  }

  findOne(id: number) {
    return `This action returns a #${id} analytics`;
  }

  update(id: number, updateAnalyticsDto: UpdateAnalyticsDto) {
    return `This action updates a #${id} analytics`;
  }

  remove(id: number) {
    return `This action removes a #${id} analytics`;
  }
}
