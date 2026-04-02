import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto, user: User) {
    const coupon = this.couponRepository.create({
      ...createCouponDto,
      businessId: user.businessId // 👈 Inyección automática de seguridad
    });
    return await this.couponRepository.save(coupon);
  }

  async findAll(user: User) {
    return this.couponRepository.find({
      where: { businessId: user.businessId } // 👈 Solo sus cupones
    });
  }

  async findOne(id: number, user: User) {
    const coupon = await this.couponRepository.findOne({
      where: { id, businessId: user.businessId }
    });
    if (!coupon) {
      throw new NotFoundException(`El cupón #${id} no existe en tu negocio`);
    }
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto, user: User) {
    const coupon = await this.findOne(id, user);
    Object.assign(coupon, updateCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async remove(id: number, user: User) {
    const coupon = await this.findOne(id, user);
    await this.couponRepository.remove(coupon);
    return { message: 'Cupón eliminado exitosamente' };
  }

  // 🛒 Endpoint de validación para el Frontend (Punto de Venta)
  async applyCoupon(applyCouponDto: ApplyCouponDto, user: User) {
    const { coupon_name, total } = applyCouponDto;

    const coupon = await this.couponRepository.findOne({
      where: { name: coupon_name, businessId: user.businessId }
    });

    if (!coupon) throw new NotFoundException(`El cupón "${coupon_name}" no es válido.`);
    if (!coupon.isActive) throw new UnprocessableEntityException('Este cupón está inactivo.');

    if (new Date() > coupon.expirationDate) {
      throw new UnprocessableEntityException('El cupón ha expirado.');
    }

    if (coupon.limit > 0 && coupon.used >= coupon.limit) {
      throw new UnprocessableEntityException('El cupón alcanzó su límite de usos.');
    }

    if (total < coupon.minPurchase) {
      throw new UnprocessableEntityException(`Se requiere una compra mínima de $${coupon.minPurchase}`);
    }

    // Calcular el dinero exacto a descontar para devolvérselo al frontend
    let discountAmount = coupon.isPercentage
      ? total * (coupon.discount / 100)
      : Number(coupon.discount);

    if (discountAmount > total) discountAmount = total;

    return {
      message: 'Cupón válido.',
      coupon: {
        name: coupon.name,
        discountAmount: discountAmount,
        newTotal: total - discountAmount
      }
    };
  }
}