// src/users/entities/user.entity.ts
import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Role } from '../../auth/roles/roles';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Business } from '../../business/entities/business.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: Role, default: Role.VENDEDOR })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- NUEVA LÓGICA DE MULTI-TENANCY ---
  // Un negocio tiene muchos usuarios, pero este usuario solo pertenece a uno.
  @ManyToOne(() => Business, (business) => business.users, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string; // Este es el UUID que usaremos para filtrar TODO
  // -------------------------------------

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}