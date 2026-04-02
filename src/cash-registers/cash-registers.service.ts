import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister, RegisterStatus } from './entities/cash-register.entity';
import { OpenRegisterDto } from './dto/open-register.dto';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CashMovement } from '../cash-movements/entities/cash-movement.entity';

@Injectable()
export class CashRegistersService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,

  ) {}

  async openRegister(user: User, openDto: OpenRegisterDto) {
    // 1. VALIDACIÓN DE SEGURIDAD: Evitar turnos duplicados
    const existingRegister = await this.cashRegisterRepository.findOne({
      where: {
        userId: user.id,
        businessId: user.businessId,
        status: RegisterStatus.OPEN,
      },
    });

    if (existingRegister) {
      throw new BadRequestException('Ya tienes un turno de caja abierto. Ciérralo antes de iniciar uno nuevo.');
    }

    // 2. CREACIÓN DEL TURNO (El "Fondo de Caja")
    const newRegister = this.cashRegisterRepository.create({
      businessId: user.businessId,
      userId: user.id,
      openingBalance: openDto.openingBalance,
      status: RegisterStatus.OPEN,
      openedAt: new Date(),
    });

    await this.cashRegisterRepository.save(newRegister);

    return {
      message: 'Turno abierto exitosamente.',
      registerId: newRegister.id,
      openingBalance: newRegister.openingBalance,
      openedAt: newRegister.openedAt,
    };
  }

  async closeRegister(user: User, closeDto: CloseRegisterDto) {
    // 1. BUSCAR CAJA ABIERTA
    const register = await this.cashRegisterRepository.findOne({
      where: {
        userId: user.id,
        businessId: user.businessId,
        status: RegisterStatus.OPEN,
      },
    });

    if (!register) {
      throw new BadRequestException('No tienes ninguna caja abierta para cerrar.');
    }

    // 2. CALCULAR EFECTIVO REAL (QueryBuilder)
    const salesResult = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.total + t.depositAmount)', 'totalCashIn') // Eliminamos la resta manual del cupón porque 'total' ya viene neto
      .where('t.userId = :userId', { userId: user.id })
      .andWhere('t.businessId = :businessId', { businessId: user.businessId })
      .andWhere('t.status = :status', { status: 'COMPLETED' })
      .andWhere('t.transactionDate >= :openedAt', { openedAt: register.openedAt })
      .getRawOne();

    // ... tu código actual del salesResult (totalCashIn) ...
    const totalCashIn = parseFloat(salesResult.totalCashIn || 0);

    // ✨ 3. CALCULAR MOVIMIENTOS DE CAJA (GASTOS E INYECCIONES)
    const movementsResult = await this.cashMovementRepository
      .createQueryBuilder('cm')
      .select(`
        SUM(CASE WHEN cm.type = 'IN' THEN cm.amount ELSE 0 END) as total_in,
        SUM(CASE WHEN cm.type = 'OUT' THEN cm.amount ELSE 0 END) as total_out
      `)
      .where('cm.userId = :userId', { userId: user.id })
      .andWhere('cm.businessId = :businessId', { businessId: user.businessId })
      .andWhere('cm.date >= :openedAt', { openedAt: register.openedAt })
      .getRawOne();

    const movementsIn = parseFloat(movementsResult?.total_in || 0);
    const movementsOut = parseFloat(movementsResult?.total_out || 0);

    // 🧮 4. MATEMÁTICAS DEL ARQUEO (LA FÓRMULA MAESTRA)
    const openingBalance = parseFloat(register.openingBalance.toString());

    // Lo que el sistema exige: Fondo + Ventas + Entradas Extras - Gastos
    const expectedBalance = openingBalance + totalCashIn + movementsIn - movementsOut;

    const actualBalance = closeDto.actualBalance;
    const difference = actualBalance - expectedBalance;

    // 5. SELLADO DE CAJA
    register.expectedBalance = expectedBalance;
    register.actualBalance = actualBalance;
    register.difference = difference;
    register.notes = closeDto.notes || null;
    register.status = RegisterStatus.CLOSED;
    register.closedAt = new Date();

    await this.cashRegisterRepository.save(register);

    // 6. DIAGNÓSTICO PARA EL FRONTEND
    let statusMsg = 'CUADRADO PERFECTO 🎯';
    if (difference > 0) statusMsg = 'SOBRANTE DE CAJA 🤑';
    if (difference < 0) statusMsg = 'FALTANTE DE CAJA 🚨';

    return {
      message: 'Turno cerrado y arqueo finalizado.',
      diagnosis: statusMsg,
      summary: {
        openingBalance,
        salesRevenue: totalCashIn,
        extraMovements: {
          cashIn: movementsIn,
          cashOut: movementsOut
        },
        expectedBalance,
        actualBalance,
        difference,
        notes: register.notes
      }
    };
  }

  // 🕵️‍♂️ Monitor de cajas para el dueño
  async findAll(user: User, status?: string) {
    const whereCondition: any = { businessId: user.businessId };

    // Si mandamos un status por query (ej. ?status=OPEN), lo filtramos
    if (status) {
      whereCondition.status = status;
    }

    return await this.cashRegisterRepository.find({
      where: whereCondition,
      relations: ['user'], // Traemos quién es el dueño de esta caja
      select: {
        id: true,
        openingBalance: true,
        expectedBalance: true,
        actualBalance: true,
        difference: true,
        status: true,
        openedAt: true,
        closedAt: true,
        notes: true,
        user: {
          id: true,
          email: true,
          // fullName: true Si lo tienes en tu entidad User
        }
      },
      order: {
        openedAt: 'DESC' // Las más recientes arriba
      }
    });
  }
}