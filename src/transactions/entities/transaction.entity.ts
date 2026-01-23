import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  total: number;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)'})
  transactionDate: Date;

  @OneToMany(() => TransactionContent, (transaction) => transaction.transaction)
  content: TransactionContent[];
}

@Entity()
export class TransactionContent{
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  quantity: number;

  @Column("decimal")
  price: number;

  @ManyToMany(()=> Product, (product) => product.id, {eager: true})
  products: Product;

  @ManyToOne(()=> Transaction, (transaction) => transaction.content)
  transaction: Transaction;
}
