import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { categories } from './data/categories';
import { products } from './data/products';
import { Coupon } from '../coupons/entities/coupon.entity';
import { coupons } from './data/coupons';
import { Deck } from '../decks/entities/deck.entity';
import { decks } from './data/decks';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
    private dataSource : DataSource
  ) {}
  async onModuleInit(){
    const connection =this.dataSource
    await connection.dropDatabase();
    await connection.synchronize();
    console.log('from onModuleInit');
  }
  async seed(){
    await this.categoryRepository.save(categories)
    await this.couponRepository.save(coupons)
    await this.deckRepository.save(decks)
    for await (const seedProduct of products){
      const category = await this.categoryRepository.findOneBy({id: seedProduct.categoryId})
      const deck = await this.deckRepository.findOneBy({id: seedProduct.deckId})
      const product = new Product();
      product.name = seedProduct.name;
      product.stock = seedProduct.stock
      // product.image = seedProduct.image
      product.price = seedProduct.price
      product.category = category;
      product.color = seedProduct.color;
      product.size = seedProduct.size;
      product.deck = deck;
      await this.productRepository.save(product);

    }
    console.log('from seeder');
  }
}
