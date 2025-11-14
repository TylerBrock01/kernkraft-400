import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
@Entity()
export class Category extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:'varchar', length: 50})
  name: string;

  @OneToMany(() => Product, (product) => product.category , {cascade: true} )
  products: Product[];
}
