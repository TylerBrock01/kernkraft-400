import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard) // 🛡️ Todo requiere estar logueado
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Post('open')
  async open(@GetUser() user: User, @Body() openDto: OpenRegisterDto) {
    return this.cashRegistersService.openRegister(user, openDto);
  }
}