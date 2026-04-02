import { Module } from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { StockAdjustmentsController } from './stock-adjustments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { Product } from '../products/entities/product.entity';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockAdjustment, Product]),BusinessModule],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentsService],
})
export class StockAdjustmentsModule {}
