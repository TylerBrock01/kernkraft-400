import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { SubscriptionsCronService } from './subscriptions-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business])],
  controllers: [BusinessController],
  providers: [BusinessService,SubscriptionsCronService],
  exports: [BusinessService, TypeOrmModule],})
export class BusinessModule {}
