import { Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Transaction } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    // Inyectamos también productos para saber qué es lo más vendido
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getWeeklySnapshot(user: User) {
    const businessId = user.businessId;

    // Calculamos el rango de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 🚀 QUERYBUILDER: Potencia pura de SQL
    const stats = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'totalSales')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .addSelect('AVG(t.total)', 'averageTicket')
      .where('t.businessId = :businessId', { businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' }) // Solo lo que sí se cobró
      .andWhere('t.transactionDate >= :sevenDaysAgo', { sevenDaysAgo })
      .getRawOne(); // Queremos los datos crudos del SUM/COUNT

    return {
      period: 'Last 7 Days',
      totalSales: parseFloat(stats.totalSales || 0),
      transactionCount: parseInt(stats.transactionCount || 0),
      averageTicket: parseFloat(stats.averageTicket || 0).toFixed(2),
      currency: 'MXN', // O la que estés usando
      businessId
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
