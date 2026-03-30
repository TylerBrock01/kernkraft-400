import { Controller, Post, Body,Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: AuthRegisterDto,
    @Headers('x-mcu-master-key') masterKey?: string // <--- Pedimos la llave en los headers
  ) {
    return this.authService.register(dto, masterKey);
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

}
