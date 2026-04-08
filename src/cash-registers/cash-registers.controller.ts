import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CloseRegisterDto } from './dto/close-register.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/roles/roles';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { CashRegister, RegisterStatus } from './entities/cash-register.entity';
import { Repository } from 'typeorm';
import { ActiveUser } from '../auth/classes/active-user.class';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.STARTER)
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService,
              @InjectRepository(CashRegister) private readonly cashRegisterRepository: Repository<CashRegister>,) {}

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Post('open')
  async open(@GetUser() user: ActiveUser, @Body() openDto: OpenRegisterDto) {
    return this.cashRegistersService.openRegister(user, openDto);
  }

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Post('close')
  async close(@GetUser() user: User, @Body() closeDto: CloseRegisterDto) {
    return this.cashRegistersService.closeRegister(user, closeDto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @GetUser() user: User,
    @Query('status') status?: string // Parámetro opcional en la URL
  ) {
    return this.cashRegistersService.findAll(user, status);
  }
  // Agrégalo en tu controlador de CashRegisters
  @Get('current')
  async getCurrentRegister(@GetUser() user: User) {
    const register = await this.cashRegisterRepository.findOne({
      where: { userId: user.id, businessId: user.businessId, status: RegisterStatus.OPEN },
    });
    return register || null; // Devuelve los datos si está abierta, o null si está cerrada
  }
}