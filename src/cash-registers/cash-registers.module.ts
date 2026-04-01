import { Module } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { CashRegistersController } from './cash-registers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegister } from './entities/cash-register.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegister,Transaction])],
  controllers: [CashRegistersController],
  providers: [CashRegistersService],
})
export class CashRegistersModule {}
