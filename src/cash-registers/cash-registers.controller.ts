import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CloseRegisterDto } from './dto/close-register.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/roles/roles';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard)
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Post('open')
  async open(@GetUser() user: User, @Body() openDto: OpenRegisterDto) {
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
}