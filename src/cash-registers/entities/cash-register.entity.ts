import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RegisterStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 🛡️ Multi-tenancy: ¿De qué empresa es esta caja?
  @Column({ name: 'business_id' })
  businessId: string;

  // 👤 ¿Qué cajero abrió este turno?
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 🚦 Estado del turno
  @Column({
    type: 'enum',
    enum: RegisterStatus,
    default: RegisterStatus.OPEN
  })
  status: RegisterStatus;

  // 🕒 Tiempos de operación
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  // 💵 MATEMÁTICAS DEL DINERO (Usamos decimal para evitar pérdida de centavos)

  // 1. Con cuánto cambio empezó el cajero (ej. $500 en monedas)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingBalance: number;

  // 2. Lo que el sistema DICE que debería haber al cerrar (Apertura + Ventas en efectivo)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedBalance: number;

  // 3. Lo que el cajero REALMENTE contó con sus manos
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualBalance: number;

  // 4. La diferencia (Positivo = Sobra dinero / Negativo = Falta dinero)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number;

  // 📝 Notas adicionales (ej. "Faltaron 20 pesos, se los cobramos a Juan")
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}