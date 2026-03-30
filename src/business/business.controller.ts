import { Controller, Get, Post, Body, Param, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }
  // src/business/business.controller.ts

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN) // SEGURIDAD CRÍTICA: Solo el dueño de la plataforma
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
}