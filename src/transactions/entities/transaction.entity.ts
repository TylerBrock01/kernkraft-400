import { Column, CreateDateColumn, Entity,
  Generated, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
export enum TransactionType {
  SALE = 'SALE',     // Venta normal (se va y no vuelve)
  RENTAL = 'RENTAL', // Renta (tiene que regresar)
}

export enum RentalStatus {
  OUT = 'OUT',           // El equipo está con el cliente
  RETURNED = 'RETURNED', // El equipo ya regresó al almacén
  LATE = 'LATE',         // Se pasó de la fecha de entrega
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED', // Devolución parcial o total
}

@Entity('transactions') // Nombre de tabla explícito
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

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
  // 🔄 ¿Es venta o renta?
  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.SALE
  })
  type: TransactionType;

  // 📅 Fecha en la que el cliente debe devolver el equipo
  @Column({ type: 'timestamp', nullable: true })
  returnDate: Date;

  // 💰 Dinero extra que se cobra como seguro (no cuenta como venta/ganancia)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  depositAmount: number;

  // 📦 Estado actual del equipo rentado
  @Column({
    type: 'enum',
    enum: RentalStatus,
    nullable: true
  })
  rentalStatus: RentalStatus;

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
