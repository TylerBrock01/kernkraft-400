import { Controller, Get, Post, Body, Param, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // 1. REGISTRO: Público o controlado (tú decides si cualquiera puede crear un negocio)
  @Post()
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  // 2. AUDITORÍA GLOBAL: Solo el Dios del sistema ve todos los inquilinos
  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  // 3. PERFIL: Ver mi propio negocio o auditoría de SuperAdmin
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    // Aquí el Service debería validar que el ID coincida con el del Token
    // a menos que sea SUPER_ADMIN
    return this.businessService.findOne(id);
  }

  // 4. EDICIÓN: El dueño cambia su nombre, logo, etc.
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto
  ) {
    return this.businessService.update(id, updateBusinessDto);
  }

  // 5. EL KILLSWITCH (Ya lo tenías, ¡impecable!)
  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  toggleBusinessStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean
  ) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('El campo isActive debe ser un valor booleano');
    }
    return this.businessService.toggleStatus(id, isActive);
  }
  @Patch(':id/subscription')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateSubscription(
    @Param('id') id: string, // Recuerda que el Business ID es un UUID string
    @Body() updateDto: UpdateSubscriptionDto
  ) {
    return this.businessService.updateSubscription(id, updateDto);
  }
}