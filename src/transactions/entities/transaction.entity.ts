import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  total: number;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)'})
  transactionDate: Date;
  @Column({ type: 'varchar',length:30, nullable: true})
  coupon: string;
  @Column({ type: 'decimal', nullable: true})
  couponDiscount: number;
  @OneToMany(() => TransactionContent, (transaction) => transaction.transaction)
  contents: TransactionContent[];

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' }) // Esto asegura que la columna se llame userId
  user: User;
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
