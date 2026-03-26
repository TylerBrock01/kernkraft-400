import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
  slug: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.RETAIL,
  })
  type: BusinessType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>; // Colores, logos, configuración regional

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.business)
  users: User[];
}