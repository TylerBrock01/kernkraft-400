import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { UploadImageModule } from '../upload-image/upload-image.module';
import { Deck } from '../decks/entities/deck.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product,Category,Deck]),UploadImageModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
