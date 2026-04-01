import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  businessId: string; // Para que el dueño solo vea los logs de su empresa

  @Column()
  userId: number; // Quién hizo la acción

  @Column()
  action: string; // Ej: 'TRANSACTION_CANCELLED'

  @Column()
  entityId: string; // El ID de la transacción, producto, etc.

  @Column({ type: 'jsonb', nullable: true })
  details: any; // Para guardar el "antes" y el "después" o el motivo

  @CreateDateColumn()
  createdAt: Date;
}