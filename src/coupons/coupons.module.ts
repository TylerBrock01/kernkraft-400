import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]),BusinessModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports:[CouponsService]
})
export class CouponsModule {}
