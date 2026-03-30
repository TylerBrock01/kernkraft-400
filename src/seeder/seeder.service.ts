import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { categories } from './data/categories';
import { products } from './data/products';
import { Coupon } from '../coupons/entities/coupon.entity';
import { decks } from './data/decks';
import { User } from '../users/entities/user.entity';
import { coupons } from './data/coupons';

@Injectable()
export class SeederService {
  constructor(
    // @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    // @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
    // @InjectRepository(User) private readonly userRepository: Repository<User>,
    private dataSource : DataSource
  ) {}
  async onModuleInit(){
    const connection =this.dataSource
    await connection.dropDatabase();
    await connection.synchronize();
    console.log('from onModuleInit');
  }
  // async seed(){
  //   await this.couponRepository.save(coupons)
  //   for await (const seedProduct of products){
  //     const product = new Product();
  //     product.name = seedProduct.name;
  //     product.stock = seedProduct.stock
  //     product.image = seedProduct.image
  //     product.price = seedProduct.price
  //     await this.productRepository.save(product);
  //
  //   }
  //
  //   // Dentro de tu función de seeding
  //   for (const seedCoupon of coupons) {
  //     // Comprobamos si el cupón ya existe para evitar errores de llave única (name)
  //     const exists = await this.couponRepository.findOneBy({ name: seedCoupon.name });
  //
  //     if (!exists) {
  //       const coupon = new Coupon();
  //
  //       // Inyección masiva de propiedades del seed al objeto Entity
  //       Object.assign(coupon, seedCoupon);
  //
  //       // Guardado en el Mainframe de Render
  //       await this.couponRepository.save(coupon);
  //       console.log(`[VASK8_OS] Protocolo inyectado: ${coupon.name}`);
  //     } else {
  //       console.log(`[VASK8_OS] Salto de seguridad: ${seedCoupon.name} ya está en el sistema.`);
  //     }
  //   }
  //   console.log('from seeder');
  // }
}
