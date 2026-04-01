import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Product } from '../products/entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';

@Module({
  imports: [
    // 🛡️ Importamos las entidades necesarias del MCU
    TypeOrmModule.forFeature([Transaction,TransactionContent, Product])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
