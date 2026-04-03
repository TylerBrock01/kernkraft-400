import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { PLAN_PRICES } from '../business/config/plan-limits.config';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getAgencyAnalytics() {
    // 1. SALUD DE LA AGENCIA (Retención)
    const totalBusinesses = await this.businessRepo.count();
    const activeBusinesses = await this.businessRepo.find({ where: { isActive: true } });

    // 2. MRR (Ingreso Mensual Recurrente) - Lo que CAZA factura en licencias
    const currentMRR = activeBusinesses.reduce((acc, business) => {
      return acc + (PLAN_PRICES[business.plan] || 0);
    }, 0);

    // 3. GMV (Gross Merchandise Value) - El volumen de dinero que mueve tu motor
    // Usamos QueryBuilder para que la base de datos sume todo y no explote el servidor
    const { gmv } = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.total)', 'gmv')
      .where('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    // 4. VOLUMEN DE USUARIOS (El total de almas usando el sistema)
    const totalUsersPlatform = await this.userRepo.count();

    return {
      agency: 'CAZA Universal Commerce Engine',
      financials: {
        mrr: Number(currentMRR.toFixed(2)), // Tus ganancias
        globalGmv: Number(gmv || 0),        // El poder de tu motor
      },
      health: {
        totalBusinesses,
        activeBusinesses: activeBusinesses.length,
        inactiveBusinesses: totalBusinesses - activeBusinesses.length,
        totalUsersPlatform,
      }
    };
  }
}