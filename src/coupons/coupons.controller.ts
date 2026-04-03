import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';

@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.STARTER)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createCouponDto: CreateCouponDto, @GetUser() user: User) {
    return this.couponsService.create(createCouponDto, user);
  }

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Get()
  findAll(@GetUser() user: User) {
    return this.couponsService.findAll(user);
  }

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.couponsService.findOne(id, user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
    @GetUser() user: User
  ) {
    return this.couponsService.update(id, updateCouponDto, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.couponsService.remove(id, user);
  }

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Post('apply')
  applyCoupon(@Body() applyCouponDto: ApplyCouponDto, @GetUser() user: User) {
    return this.couponsService.applyCoupon(applyCouponDto, user);
  }
}