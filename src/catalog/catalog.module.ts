import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Business } from '../business/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Business])],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
