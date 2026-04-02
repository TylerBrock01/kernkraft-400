import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CancelTransactionDto } from './dto/cancel-transaction';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { RefundSaleDto } from './dto/refund-sale.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard,BusinessActiveGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetUser() user: User, // Obtenemos al vendedor/admin desde el token
  ) {
    // Extraemos el businessId del usuario para asegurar que la venta
    // se registre en la empresa correcta.
    const businessId = user.businessId;

    return this.transactionsService.create(createTransactionDto, user, businessId);
  }

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Get()
  findAll(
    @Query('transactionDate') transactionDate: string,
    @GetUser() user: User,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    return this.transactionsService.findAll(user,transactionDate, take, skip);
  }

  @Roles(Role.ADMIN,Role.VENDEDOR)
  @Get(':id')
  findOne(@Param('id',IdValidationPipe) id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN, Role.VENDEDOR) // Solo el alto mando cancela
  async returnRental(
    @Param('id') id: number,
    @Body() returnDto: ReturnRentalDto,
    @GetUser() user: User
  ) {
    return this.transactionsService.returnRental(id, returnDto, user, user.businessId);
  }

  @Post(':id/refund')
  refundSale(
    @Param('id', ParseIntPipe) id: number,
    @Body() refundDto: RefundSaleDto,
    @GetUser() user: User
  ) {
    return this.transactionsService.refundSale(id, refundDto, user, user.businessId);
  }
}
