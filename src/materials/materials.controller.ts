import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ReceiveStockDto } from './dto/receive-stock.dto';
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

@Controller('materials')
@Roles(Role.ADMIN, Role.ALMACEN)
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard, PlanGuard)
@RequirePlan(SubscriptionPlan.LITE)
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Post()
  create(@Body() dto: CreateMaterialDto, @GetUser() user: ActiveUser) {
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

  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() dto: UpdateMaterialDto,
    @GetUser() user: ActiveUser,
  ) {
    return this.service.update(+id, dto, user);
  }

  @Post(':id/receive')
  receive(
    @Param('id', IdValidationPipe) id: string,
    @Body() dto: ReceiveStockDto,
    @GetUser() user: ActiveUser,
  ) {
    return this.service.receiveStock(+id, dto, user);
  }

  @Get(':id/movements')
  history(@Param('id', IdValidationPipe) id: string, @GetUser() user: ActiveUser) {
    return this.service.history(+id, user);
  }
}