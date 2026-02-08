import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Deck {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type: 'varchar', length: 20})
  name: string;
  @Column({ type: 'varchar', nullable: true, default: 'default.svg'})
  image: string;
  @OneToMany(() => Product, (product) => product.deck , {cascade: true} )
  products: Product[];
}
