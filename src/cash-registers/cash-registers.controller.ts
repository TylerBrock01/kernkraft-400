import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CloseRegisterDto } from './dto/close-register.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/roles/roles';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, RolesGuard) // 🛡️ Todo requiere estar logueado
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Post('open')
  @Roles(Role.ADMIN,Role.VENDEDOR)
  async open(@GetUser() user: User, @Body() openDto: OpenRegisterDto) {
    return this.cashRegistersService.openRegister(user, openDto);
  }

  @Post('close')
  @Roles(Role.ADMIN,Role.VENDEDOR)
  async close(@GetUser() user: User, @Body() closeDto: CloseRegisterDto) {
    return this.cashRegistersService.closeRegister(user, closeDto);
  }
}