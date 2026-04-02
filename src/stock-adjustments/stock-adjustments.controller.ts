import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('stock-adjustments')
@Roles(Role.ADMIN, Role.ALMACEN)
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard)
export class StockAdjustmentsController {
  constructor(private readonly stockAdjustmentsService: StockAdjustmentsService) {}

  @Post()
  create(
    @Body() createDto: CreateStockAdjustmentDto,
    @GetUser() user: User
  ) {
    return this.stockAdjustmentsService.create(createDto, user.businessId, user.id);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.stockAdjustmentsService.findAll(user.businessId);
  }
}