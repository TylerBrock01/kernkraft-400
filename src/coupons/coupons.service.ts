// src/coupons/coupons.service.ts
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { endOfDay, isAfter } from 'date-fns';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    // Registramos el nuevo hardware de descuento
    return await this.couponRepository.save(createCouponDto);
  }

  findAll() {
    return this.couponRepository.find();
  }

  async findOne(id: number) {
    const coupon = await this.couponRepository.findOneBy({ id });
    if (!coupon) {
      throw new NotFoundException(`Coupon_ID #${id} not found in database`);
    }
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findOne(id); // findOne ya maneja el error 404
    Object.assign(coupon, updateCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async remove(id: number) {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
    return { message: 'Coupon_Deleted_Successfully' };
  }

  async applyCoupon(applyCouponDto: ApplyCouponDto) {
    const { coupon_name, total } = applyCouponDto;

    // 1. EXISTENCIA
    const coupon = await this.couponRepository.findOneBy({ name: coupon_name });
    if (!coupon) {
      throw new NotFoundException(`Coupon code "${coupon_name}" is invalid`);
    }

    // 2. ACTIVACIÓN MANUAL
    if (!coupon.isActive) {
      throw new UnprocessableEntityException('This coupon is currently inactive');
    }

    // 3. VIGENCIA (FECHA)
    const currentDate = new Date();
    const expirationDate = endOfDay(coupon.expirationDate);
    if (isAfter(currentDate, expirationDate)) {
      throw new UnprocessableEntityException('Coupon has expired');
    }

    // 4. DISPONIBILIDAD (LÍMITE DE USOS)
    if (coupon.limit > 0 && coupon.used >= coupon.limit) {
      throw new UnprocessableEntityException('Usage limit reached for this coupon');
    }

    // 5. COMPRA MÍNIMA (RESTRICCIÓN FINANCIERA)
    // Validamos si el total del carrito es suficiente para despertar el cupón
    if (total < coupon.minPurchase) {
      throw new UnprocessableEntityException(
        `Minimum purchase of $${coupon.minPurchase} required to use this coupon`
      );
    }

    // Si pasa todas las pruebas, devolvemos el cupón para que el frontend calcule el descuento
    return {
      message: 'Protocol accepted: Coupon applied',
      coupon
    };
  }

  async confirmCouponUsage(couponName: string) {
    const coupon = await this.couponRepository.findOneBy({ name: couponName });

    if (coupon) {
      // 1. Incrementamos el contador de telemetría
      coupon.used += 1;

      // 2. Opcional: Si el cupón llegó a su límite exacto,
      // podríamos desactivarlo automáticamente, aunque la lógica
      // de applyCoupon ya lo bloquea por el conteo.
      if (coupon.limit > 0 && coupon.used >= coupon.limit) {
        console.log(`[VASK8_OS] Alerta: Cupón ${coupon.name} ha agotado su límite de hardware.`);
      }

      // 3. Guardado final en Render DB
      await this.couponRepository.save(coupon);

      return {
        status: 'COMMIT_SUCCESS',
        currentUsed: coupon.used
      };
    }
  }
}