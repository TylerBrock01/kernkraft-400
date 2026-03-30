import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  businessId: string; // VITAL para el aislamiento

  @Column('decimal')
  total: number;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)'})
  transactionDate: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  coupon: string;

  @Column({ type: 'decimal', nullable: true })
  couponDiscount: number;

  // El cascade puede ir aquí si quieres que al borrar la Transaction se borren los contenidos
  @OneToMany(() => TransactionContent, (content) => content.transaction, { cascade: true })
  contents: TransactionContent[];

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;
}

@Entity()
export class TransactionContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  quantity: number;

  @Column("decimal")
  price: number;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  // ELIMINA EL { cascade: true } DE AQUÍ ABAJO:
  @ManyToOne(() => Transaction, (transaction) => transaction.contents)
  transaction: Transaction;
}
