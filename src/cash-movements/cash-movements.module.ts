import { Module } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CashMovementsController } from './cash-movements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashMovement } from './entities/cash-movement.entity';
import { CashRegister } from '../cash-registers/entities/cash-register.entity';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [TypeOrmModule.forFeature([CashMovement,CashRegister]),BusinessModule],
  controllers: [CashMovementsController],
  providers: [CashMovementsService],
})
export class CashMovementsModule {}
