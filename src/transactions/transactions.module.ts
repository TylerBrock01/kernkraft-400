import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from './entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction,TransactionContent,Product]),
    CouponsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
