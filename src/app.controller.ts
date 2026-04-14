import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }
  @Get()
  check() {
    // Un JSON ligerísimo que Render procesa en 2 milisegundos
    return {
      status: 'Motor CAZA Operativo 🚀',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
