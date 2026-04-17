// src/products/entities/product.entity.ts
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index // <--- Agregamos Index
} from 'typeorm';
import { Business, BusinessType } from '../../business/entities/business.entity';

@Entity('products')
// REGLA DE ORO: El slug solo es único si se combina con el businessId
@Index(['slug', 'businessId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  slug: string;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  stock: number;

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.RETAIL,
  })
  type: BusinessType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}