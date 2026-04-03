import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Business } from './entities/business.entity';

@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  // 🧹 LIMPIEZA NOCTURNA: Se ejecuta todos los días a las 12:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionExpirations() {
    this.logger.log('Iniciando auditoría de suscripciones expiradas...');

    const now = new Date();

    // 1. Buscamos negocios que:
    // - Tengan licencia vencida (licenseValidUntil < ahora)
    // - Sigan marcados como activos (isActive = true)
    const expiredBusinesses = await this.businessRepository.find({
      where: {
        licenseValidUntil: LessThan(now),
        isActive: true,
      },
    });

    if (expiredBusinesses.length === 0) {
      this.logger.log('No se encontraron suscripciones vencidas hoy.');
      return;
    }

    // 2. Suspensión masiva
    const suspendedIds = expiredBusinesses.map((b) => b.id);

    // Usamos update para mayor eficiencia (afecta a muchos de golpe)
    await this.businessRepository.update(suspendedIds, {
      isActive: false,
    });

    this.logger.warn(
      `Se han suspendido ${expiredBusinesses.length} negocios por falta de pago. IDs: ${suspendedIds.join(', ')}`
    );
  }
}