import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CashMovement, CashMovementCategory, CashMovementType } from './entities/cash-movement.entity';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { User } from '../users/entities/user.entity';
import { CashRegister, RegisterStatus } from '../cash-registers/entities/cash-register.entity';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class CashMovementsService {
  constructor(
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    // 🛡️ Inyectamos la caja para validar el turno
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
  ) {}


  async create(createDto: CreateCashMovementDto, user: ActiveUser) {
    // 1. VALIDACIÓN CRÍTICA: ¿Hay caja abierta?
    const openRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId: user.id,
        businessId: user.businessId,
        status: RegisterStatus.OPEN,
      },
    });

    if (!openRegister) {
      throw new BadRequestException('Operación denegada: Debes abrir tu turno de caja antes de registrar movimientos de efectivo.');
    }

    // 🛡️ 2. EL ESCUDO CONTABLE: Validaciones de Lógica de Negocio
    // Si no mandan categoría, asumimos que es 'OTHER' (ej. meter monedas para dar cambio)
    const finalCategory = createDto.category || CashMovementCategory.OTHER;

    // REGLA DE ORO: Un Gasto, Devolución o Retiro de Dueño JAMÁS puede ser una Entrada (IN)
    const isOutgoingCategory =
      finalCategory === CashMovementCategory.OPERATING_EXPENSE ||
      finalCategory === CashMovementCategory.DEPOSIT_REFUND ||
      finalCategory === CashMovementCategory.CAPITAL_WITHDRAWAL;

    if (isOutgoingCategory && createDto.type === CashMovementType.IN) {
      throw new BadRequestException(
        `Conflicto contable: La categoría '${finalCategory}' obliga a que el movimiento sea una SALIDA (OUT) de dinero.`
      );
    }

    // 3. REGISTRAR EL MOVIMIENTO
    const movement = this.cashMovementRepository.create({
      ...createDto,
      category: finalCategory, // ✨ Inyectamos la categoría validada
      businessId: user.businessId,
      userId: user.id,
      date: new Date()
    });

    await this.cashMovementRepository.save(movement);

    return {
      message: `Movimiento de ${createDto.type === 'IN' ? 'ENTRADA' : 'SALIDA'} registrado exitosamente.`,
      movement
    };
  }

  // Endpoint para que el cajero vea sus movimientos del turno actual
  async getMyShiftMovements(user: User) {
    const openRegister = await this.cashRegisterRepository.findOne({
      where: { userId: user.id, businessId: user.businessId, status: RegisterStatus.OPEN },
    });

    if (!openRegister) return []; // Si no hay caja, no hay movimientos del turno

    return await this.cashMovementRepository
      .createQueryBuilder('cm')
      .where('cm.userId = :userId', { userId: user.id })
      .andWhere('cm.businessId = :businessId', { businessId: user.businessId })
      .andWhere('cm.date >= :openedAt', { openedAt: openRegister.openedAt })
      .orderBy('cm.date', 'DESC')
      .getMany();
  }

  // 🕵️‍♂️ Endpoint exclusivo para el dueño (Auditoría)
  async findAll(
    user: User,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = { businessId: user.businessId };

    // 📅 Filtro de Fechas Pro
    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate));
    }

    // 🚀 Consulta con Paginación
    const [data, total] = await this.cashMovementRepository.findAndCount({
      where,
      relations: ['user'],
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        date: true,
        user: { id: true, email: true }
      },
      order: { date: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }
}