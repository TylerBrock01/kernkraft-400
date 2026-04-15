import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CancelTransactionDto } from './dto/cancel-transaction';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';
import { ActiveUser } from '../auth/classes/active-user.class';

@Controller('transactions')
// ✨ 1. Agregamos el PlanGuard a la lista de seguridad
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard, PlanGuard)
// ✨ 2. Declaramos que este controlador es exclusivo desde MOTOR para arriba
@RequirePlan(SubscriptionPlan.STARTER)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles(Role.ADMIN, Role.VENDEDOR)
  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetUser() user: ActiveUser, // <--- Usamos ActiveUser con su plan y negocio
  ) {
    // Le pasamos solo el DTO y el User. El servicio se encarga del resto.
    return this.transactionsService.create(createTransactionDto, user);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('transactionDate') transactionDate: string,
    @GetUser() user: User,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    return this.transactionsService.findAll(user,transactionDate, take, skip);
  }
  @Get('returnDate')
  @Roles(Role.ADMIN, Role.VENDEDOR, Role.ALMACEN)
  getDailyRadar(
    @GetUser() user: ActiveUser,
    @Query('date') targetDate?: string, // Ej: ?date=2026-04-12
  ) {
    return this.transactionsService.getDailyRadar(user, targetDate);
  }

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Get(':id')
  findOne(@Param('id',IdValidationPipe) id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Roles(Role.ADMIN,Role.ALMACEN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id',IdValidationPipe) id: string) {
    return this.transactionsService.remove(+id);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN) // Solo el alto mando cancela
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Body() cancelDto: CancelTransactionDto, // 📥 Capturamos el motivo aquí
  ) {
    // Extraemos el businessId del usuario inyectado por el Guard
    const businessId = user.businessId;

    return this.transactionsService.cancel(
      id,
      user,
      businessId,
      cancelDto.reason // 🛡️ Pasamos el motivo al service
    );
  }

  @Post(':id/return')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  async returnRental(
    @Param('id') id: number,
    @Body() returnDto: ReturnRentalDto,
    @GetUser() user: User
  ) {
    return this.transactionsService.returnRental(id, returnDto, user, user.businessId);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN) // Solo el alto mando hace reembolso
  refundSale(
    @Param('id', ParseIntPipe) id: number,
    @Body() refundDto: RefundSaleDto,
    @GetUser() user: User
  ) {
    return this.transactionsService.refundSale(id, refundDto, user, user.businessId);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.VENDEDOR,Role.ALMACEN)
  async resolveMission(
    @Param('id',ParseIntPipe) id: number,
    @GetUser() user: ActiveUser,
  ) {
    return this.transactionsService.resolveMission(id, user);
  }

  @Get('history/me')
  async getMyHistory(
    @GetUser() user: ActiveUser,
    @Query('limit') limit: number = 10,
  ) {
    // El controlador delega el trabajo inmediatamente
    return this.transactionsService.getUserHistory(user, limit);
  }
}
