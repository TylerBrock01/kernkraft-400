import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED', // Devolución parcial o total
}

@Entity('transactions') // Nombre de tabla explícito
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED
  })
  status: TransactionStatus;

  @Column({ name: 'business_id' }) // Mantenemos el aislamiento
  businessId: string;

  @Column({ name: 'user_id', nullable: true }) // Columna física para el ID del vendedor
  userId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn({ name: 'transaction_date', type: 'timestamp' })
  transactionDate: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  coupon: string;

  @Column({ name: 'coupon_discount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  couponDiscount: number;

  // RELACIONES
  @OneToMany(() => TransactionContent, (content) => content.transaction, { cascade: true })
  contents: TransactionContent[];

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' }) // Vincula la relación a la columna física user_id
  user: User;
}

@Entity('transaction_contents')
export class TransactionContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_id' }) // Columna física para el enlace al padre
  transactionId: number;

  @Column({ name: 'product_id' }) // Columna física para el enlace al producto
  productId: number;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Snapshot del precio al momento de venta

  // RELACIONES
  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Transaction, (transaction) => transaction.contents)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
