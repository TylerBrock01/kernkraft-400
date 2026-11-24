import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { Unit } from '../../units/entities/unit.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

export enum MaterialType {
  RAW = 'raw',
  INTERMEDIATE = 'intermediate',
  PACKAGING = 'packaging',
}

const num = { type: 'numeric' as const, precision: 18, scale: 6, transformer: numericTransformer };

@Entity('materials')
@Index(['businessId', 'sku'], { unique: true })
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column({ type: 'enum', enum: MaterialType, default: MaterialType.RAW })
  type: MaterialType;

  @ManyToOne(() => Unit, { nullable: false, onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'baseUnitId' })
  baseUnit: Unit;

  @Column({ type: 'int' })
  baseUnitId: number;

  // Solo lo modifica InventoryService. Nunca por el CRUD.
  @Column({ ...num, default: 0 })
  stock: number;

  @Column({ ...num, default: 0 })
  avgCost: number;

  @Column({ ...num, default: 0 })
  minStock: number;

  @Column({ default: false })
  allowNegativeStock: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}