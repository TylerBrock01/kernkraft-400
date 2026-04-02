import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';

@Controller('cash-movements')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard)
export class CashMovementsController {
  constructor(private readonly cashMovementsService: CashMovementsService) {}

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Post()
  create(@Body() createDto: CreateCashMovementDto, @GetUser() user: User) {
    return this.cashMovementsService.create(createDto, user);
  }

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Get('my-shift')
  getMyShiftMovements(@GetUser() user: User) {
    return this.cashMovementsService.getMyShiftMovements(user);
  }

  // 🛡️ Solo el Administrador puede ver el historial completo de la empresa
  @Roles(Role.ADMIN)
  @Get()
  findAll(@GetUser() user: User) {
    return this.cashMovementsService.findAll(user);
  }
}