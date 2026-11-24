import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { Material } from '../../materials/entities/material.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

export enum MovementType {
  PURCHASE = 'purchase',
  PRODUCTION_CONSUME = 'production_consume',
  PRODUCTION_OUTPUT = 'production_output',
  ADJUSTMENT = 'adjustment',
  SALE = 'sale',
}

const num = { type: 'numeric' as const, precision: 18, scale: 6, transformer: numericTransformer };

@Entity('stock_movements')
@Index(['businessId', 'materialId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @ManyToOne(() => Material, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ type: 'int' })
  materialId: number;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  // Con signo: positivo entra, negativo sale. En la unidad BASE del material.
  @Column(num) quantity: number;
  @Column(num) unitCost: number;

  // Saldo del material después de este movimiento (auditoría)
  @Column(num) balanceAfter: number;

  @Column({ type: 'varchar', nullable: true })
  refType: string | null; // 'production_order', 'ticket'...

  @Column({ type: 'int', nullable: true })
  refId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}