import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typerorm.config';
import { ProductsModule } from './products/products.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CouponsModule } from './coupons/coupons.module';
import { UploadImageModule } from './upload-image/upload-image.module';
import { DecksModule } from './decks/decks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BussinesModule } from './bussines/bussines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    CategoriesModule,
    ProductsModule,
    TransactionsModule,
    CouponsModule,
    UploadImageModule,
    DecksModule,
    AuthModule,
    UsersModule,
    BussinesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
