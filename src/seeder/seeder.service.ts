import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { categories } from './data/categories';
import { products } from './data/products';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Deck } from '../decks/entities/deck.entity';
import { decks } from './data/decks';
import { User } from '../users/entities/user.entity';
import { coupons } from './data/coupons';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
      product.image = seedProduct.image
      product.price = seedProduct.price
      product.category = category;
      product.color = seedProduct.color;
      product.size = seedProduct.size;
      product.deck = deck;
      await this.productRepository.save(product);

    }

    // Dentro de tu función de seeding
    for (const seedCoupon of coupons) {
      // Comprobamos si el cupón ya existe para evitar errores de llave única (name)
      const exists = await this.couponRepository.findOneBy({ name: seedCoupon.name });

      if (!exists) {
        const coupon = new Coupon();

        // Inyección masiva de propiedades del seed al objeto Entity
        Object.assign(coupon, seedCoupon);

        // Guardado en el Mainframe de Render
        await this.couponRepository.save(coupon);
        console.log(`[VASK8_OS] Protocolo inyectado: ${coupon.name}`);
      } else {
        console.log(`[VASK8_OS] Salto de seguridad: ${seedCoupon.name} ya está en el sistema.`);
      }
    }
    console.log('from seeder');
  }
}
