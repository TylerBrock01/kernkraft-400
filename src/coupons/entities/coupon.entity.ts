import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  // 🛡️ EL CANDADO SAAS: Este cupón le pertenece a un solo negocio
  @Column({ name: 'business_id' })
  businessId: string;

  // Le quitamos el "unique: true" para que diferentes negocios usen el mismo código
  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discount: number;

  @Column({ type: 'boolean', default: true })
  isPercentage: boolean;

  @Column({ type: 'integer', default: 0 })
  limit: number;

  @Column({ type: 'integer', default: 0 })
  used: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  minPurchase: number;

  @Column({ type: 'timestamp' }) // Cambiamos date a timestamp para más precisión
  expirationDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}