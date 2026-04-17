import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CashMovementType {
  IN = 'IN',   // Entrada (ej: inyección de cambio, préstamos)
  OUT = 'OUT', // Salida (ej: pago de luz, compra de insumos, pago a proveedores)
}
export enum CashMovementCategory {
  OPERATING_EXPENSE = 'OPERATING_EXPENSE', // Luz, agua, renta, mermas compradas
  DEPOSIT_REFUND = 'DEPOSIT_REFUND',       // Devolución de garantía (NO afecta ganancia)
  CAPITAL_WITHDRAWAL = 'CAPITAL_WITHDRAWAL', // El dueño sacó dinero para irse a cenar
  OTHER = 'OTHER',
}

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  businessId: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: CashMovementType,
  })
  type: CashMovementType;

  @Column({
    type: 'enum',
    enum: CashMovementCategory,
    default: CashMovementCategory.OTHER // Por defecto asumimos que es gasto
  })
  category: CashMovementCategory;

  @Column({ type: 'text' })
  reason: string; // Ej: "Pago de recibo de luz", "Compra de servilletas"

  @CreateDateColumn({ name: 'date' })
  date: Date;

  // Relación con el usuario que hizo el movimiento
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}