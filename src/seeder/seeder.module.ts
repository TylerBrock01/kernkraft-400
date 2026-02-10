import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../config/typerorm.config';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Deck } from '../decks/entities/deck.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product,Category,Coupon,Deck]),
  ],
  providers: [SeederService]
})
export class SeederModule {}
