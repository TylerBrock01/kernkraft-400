import { Column, CreateDateColumn, Entity,
  Generated, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CashRegister } from '../../cash-registers/entities/cash-register.entity'; // 👈 NUEVO IMPORT

export enum TransactionType {
  SALE = 'SALE',     // Venta normal (se va y no vuelve)
  RENTAL = 'RENTAL', // Renta (tiene que regresar)
}

export enum RentalStatus {
  UNFULFILLED = 'UNFULFILLED', // El producto sigue en nuestra bodega/vitrina (Es un Pick-Up).
  FULFILLED = 'FULFILLED',     // El cliente ya vino por él y se lo llevó.

  OUT = 'OUT',           // El equipo está con el cliente
  RETURNED = 'RETURNED', // El equipo ya regresó al almacén
  LATE = 'LATE',         // Se pasó de la fecha de entrega
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL', //abonos
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED', // Devolución parcial o total
  PENDING = 'PENDING',
}

export enum PaymentMethod {
  CASH = 'CASH',           // Efectivo físico
  CARD = 'CARD',           // Terminal bancaria
  TRANSFER = 'TRANSFER',   // SPEI / Transferencia
}

@Entity('transactions') // Nombre de tabla explícito
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  // 💳 Método de pago usado en esta transacción
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH
  })
  paymentMethod: PaymentMethod;

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

  // 💰 Total de la nota
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  // 💰 NUEVO: Efectivo real que entró a la caja en este momento (Abono o Total)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @CreateDateColumn({ name: 'transaction_date', type: 'timestamp' })
  transactionDate: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  coupon: string;

  @Column({ name: 'coupon_discount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  couponDiscount: number;

  // 🛒 NUEVO: ¿En qué turno de caja se cobró esto?
  @Column({ name: 'cash_register_id', nullable: true })
  cashRegisterId: string;

  @ManyToOne(() => CashRegister)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

  // RELACIONES
  @OneToMany(() => TransactionContent, (content) => content.transaction, { cascade: true })
  contents: TransactionContent[];

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 👤 ID físico del cliente
  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.transactions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}

@Entity('transaction_contents')
export class TransactionContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  // RELACIONES
  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Transaction, (transaction) => transaction.contents)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}