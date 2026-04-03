import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Product } from '../products/entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';
import { StockAdjustment } from '../stock-adjustments/entities/stock-adjustment.entity';
import { CashMovement } from '../cash-movements/entities/cash-movement.entity';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [
    // 🛡️ Importamos las entidades necesarias del MCU
    TypeOrmModule.forFeature([Transaction,TransactionContent, Product,StockAdjustment,CashMovement]),BusinessModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
