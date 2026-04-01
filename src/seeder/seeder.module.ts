import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../config/typerorm.config';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product,User]),
  ],
  providers: [SeederService]
})
export class SeederModule {}
