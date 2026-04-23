import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CashRegister } from '../../cash-registers/entities/cash-register.entity'; // 👈 NUEVO IMPORT

export enum CashMovementType {
  IN = 'IN',   // Entrada (ej: inyección de cambio, préstamos)
  OUT = 'OUT', // Salida (ej: pago de luz, compra de insumos, pago a proveedores)
}

// 👈 NUEVO: Categorías actualizadas
export enum CashMovementCategory {
  INITIAL_CHANGE = 'INITIAL_CHANGE',         // El fondo de caja ($500 en monedas al abrir)
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',   // Luz, agua, renta
  WASTE_LOSS = 'WASTE_LOSS',                 // Dinero perdido por mermas/robos/comida echada a perder
  DEPOSIT_REFUND = 'DEPOSIT_REFUND',         // Devolución de garantía (NO afecta ganancia)
  DEPOSIT = 'DEPOSIT',
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

  // 🛒 NUEVO: ¿De qué turno de caja se sacó o metió este dinero?
  @Column({ name: 'cash_register_id', nullable: true })
  cashRegisterId: string;

  @ManyToOne(() => CashRegister)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

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
    default: CashMovementCategory.OTHER
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