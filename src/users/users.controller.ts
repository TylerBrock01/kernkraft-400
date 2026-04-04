// src/users/users.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { GetBusinessId } from '../auth/decorators/get-business-id.decorator';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ActiveUser } from '../auth/classes/active-user.class'; // No olvides importar bcrypt

@Controller('users')
@Roles(Role.SUPER_ADMIN,Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard,PlanGuard) // Protegemos todo el controlador
@RequirePlan(SubscriptionPlan.STARTER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Crear usuarios adicionales (Ej: El admin creando vendedores)
  @Post('employee')
  async createEmployee(
    @Body() createUserDto: CreateUserDto,
    @GetUser() admin: ActiveUser // <-- Cambiamos User por ActiveUser
  ) {
    createUserDto.businessId = admin.businessId;

    if (createUserDto.role === Role.SUPER_ADMIN) {
      createUserDto.role = Role.VENDEDOR;
    }

    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    // Pasamos admin.plan como segundo argumento
    return this.usersService.create(createUserDto, admin.plan);
  }

  @Get()
  findAll(@GetUser() user: ActiveUser) {
    // Solo devolvemos usuarios de MI empresa
    return this.usersService.findAll(user);
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