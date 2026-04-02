import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from './entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { CouponsModule } from '../coupons/coupons.module';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { BusinessModule } from '../business/business.module';
import { CashRegister } from '../cash-registers/entities/cash-register.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CashMovement } from '../cash-movements/entities/cash-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction,TransactionContent,Product,AuditLog,CashRegister,Coupon,CashMovement]),BusinessModule,
    CouponsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
