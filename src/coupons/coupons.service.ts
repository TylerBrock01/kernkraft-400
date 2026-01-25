import { Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CouponsService {

  constructor(
    @InjectRepository(Coupon)private readonly couponRepository: Repository<Coupon>,
  ) {}
  create(createCouponDto: CreateCouponDto) {
    console.log(createCouponDto);
    return this.couponRepository.save(createCouponDto);
  }

  findAll() {
    return this.couponRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(id: number, updateCouponDto: UpdateCouponDto) {
    return `This action updates a #${id} coupon`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
