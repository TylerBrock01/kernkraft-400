// src/users/users.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetBusinessId } from '../auth/decorators/get-business-id.decorator';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';

@Controller('users')
@Roles(Role.SUPER_ADMIN,Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard) // Protegemos todo el controlador
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Crear usuarios adicionales (Ej: El admin creando vendedores)
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @GetBusinessId() businessId: string
  ) {
    // Forzamos que el nuevo usuario pertenezca al mismo negocio que quien lo crea
    createUserDto.businessId = businessId;
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@GetBusinessId() businessId: string) {
    // Solo devolvemos usuarios de MI empresa
    return this.usersService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.usersService.findOne(+id, businessId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetBusinessId() businessId: string
  ) {
    return this.usersService.update(+id, updateUserDto, businessId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.usersService.remove(+id, businessId);
  }
}