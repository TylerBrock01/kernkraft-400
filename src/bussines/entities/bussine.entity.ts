import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BusinessType {
  RETAIL = 'retail',
  FOOD = 'food',
  SERVICE = 'service',
}

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string; // Ejemplo: 'vask8-shop'

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.RETAIL,
  })
  type: BusinessType;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    primaryColor: string;
    logoUrl: string;
    currency: string;
    taxRate: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Un negocio tiene muchos usuarios (Dueño, Vendedores, etc.)
  @OneToMany(() => User, (user) => user.business)
  users: User[];
}