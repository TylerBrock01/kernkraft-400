import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { PlanGuard } from '../auth/guards/plan.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ActiveUser } from '../auth/classes/active-user.class';

@Controller('units')
@Roles(Role.ADMIN, Role.ALMACEN)
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard, PlanGuard)
@RequirePlan(SubscriptionPlan.LITE) // el módulo de fábrica es candidato a plan superior; ajusta aquí
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Post()
  create(@Body() dto: CreateUnitDto, @GetUser() user: ActiveUser) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@GetUser() user: ActiveUser) {
    return this.service.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string, @GetUser() user: ActiveUser) {
    return this.service.findOne(+id, user);
  }
}