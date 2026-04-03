import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { SuperAdminService } from './super_admin.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN) // 🛡️ SOLO PARA LOS OJOS DEL DUEÑO DE LA AGENCIA
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('analytics')
  getAnalytics() {
    return this.superAdminService.getAgencyAnalytics();
  }
}