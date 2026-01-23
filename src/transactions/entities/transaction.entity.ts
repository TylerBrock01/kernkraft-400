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
  contents: TransactionContent[];
}

@Entity()
export class TransactionContent{
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  quantity: number;

  @Column("decimal")
  price: number;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @ManyToOne(()=> Transaction, (transaction) => transaction.contents, {cascade: true})
  transaction: Transaction;
}
