// src/coupons/entities/coupon.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  name: string; // El código que escribe el usuario (ej: VASK8_PRO)

  @Column({ type: 'integer' })
  discount: number; // El valor del descuento

  @Column({ type: 'boolean', default: true })
  isPercentage: boolean; // ¿Es un 10% o son 10 pesos? Fundamental.

  @Column({ type: 'integer', default: 0 })
  limit: number; // Máximo de veces que se puede usar (0 = infinito)

  @Column({ type: 'integer', default: 0 })
  used: number; // Contador de cuántas veces se ha canjeado

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minPurchase: number; // Compra mínima necesaria para que el cupón "despierte"

  @Column({ type: 'date' })
  expirationDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Interruptor de seguridad para apagar el cupón manualmente

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}