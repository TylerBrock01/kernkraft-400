import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Deck } from '../../decks/entities/deck.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 50})
  name: string;
  @Column({ type: 'varchar', length: 120, nullable: true, default: 'default.svg'})
  image: string;
  @Column({ type: 'decimal'})
  price: number;
  @Column({ type: 'int'})
  stock: number;
  @ManyToOne(() => Category, {eager: true})
  category: Category;
  @Column({type: 'varchar', length: 20})
  color: string;
  @Column({type: 'decimal'})
  size: number
  @ManyToOne(()=> Deck, {eager: true})
  deck: Deck;
}