// src/users/entities/user.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../auth/roles/roles';
import { Transaction } from '../../transactions/entities/transaction.entity';

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

  // El 'select: false' hace que no se envíe la pass por accidente en los GET
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

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}