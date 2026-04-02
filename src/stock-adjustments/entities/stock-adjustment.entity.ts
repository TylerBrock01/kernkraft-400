import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum AdjustmentReason {
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  EXPIRATION = 'EXPIRATION',
  LOSS = 'LOSS',
  INTERNAL_USE = 'INTERNAL_USE'
}

@Entity('stock_adjustments')
export class StockAdjustment {
  @PrimaryGeneratedColumn()
  id: number; // Ajustado a number para mantener consistencia con tus otras tablas

  @Column()
  businessId: string; // Tu identificador multitenant en formato string

  @Column({ type: 'int' })
  productId: number; // Ahora coincide con Product.id

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'enum', enum: AdjustmentReason })
  reason: AdjustmentReason;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int' })
  createdBy: number; // Ahora coincide con User.id

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  user: User;
}