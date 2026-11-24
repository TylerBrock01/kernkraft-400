import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('units')
@Index(['businessId', 'symbol'], { unique: true })
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @Column()
  name: string; // Gramo

  @Column()
  symbol: string; // g

  // null = esta unidad ES una unidad base (kg, l, pza)
  @ManyToOne(() => Unit, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'baseUnitId' })
  baseUnit: Unit | null;

  @Column({ type: 'int', nullable: true })
  baseUnitId: number | null;

  // 1 de esta unidad = factor de la base. g -> kg: 0.001
  @Column({ type: 'numeric', precision: 18, scale: 6, default: 1, transformer: numericTransformer })
  factor: number;
}