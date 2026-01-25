import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { categories } from './data/categories';
import { products } from './data/products';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
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
    for await (const seedProduct of products){
      const category = await this.categoryRepository.findOneBy({id: seedProduct.categoryId})
      const product = new Product();
      product.name = seedProduct.name;
      product.stock = seedProduct.inventory
      product.price = seedProduct.price
      product.category = category;
      await this.productRepository.save(product);

    }
    console.log('from seeder');
  }
}
