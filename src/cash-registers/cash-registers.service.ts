import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister, RegisterStatus } from './entities/cash-register.entity';
import { OpenRegisterDto } from './dto/open-register.dto';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CashMovement } from '../cash-movements/entities/cash-movement.entity';
import { ActiveUser } from '../auth/classes/active-user.class';
import { PLAN_LIMITS } from '../business/config/plan-limits.config';

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

  async openRegister(user: ActiveUser, openDto: OpenRegisterDto) {
    const businessId = user.businessId;

    if (!user?.id) {
      throw new BadRequestException('Error crítico: El vendedor no está identificado en el sistema.');
    }

    const maxCashRegisters = PLAN_LIMITS[user.plan].maxCashRegisters;

    // 1. BARRERA DE PLAN: ¿El plan incluye el módulo POS?
    if (maxCashRegisters === 0) {
      throw new ForbiddenException(
        'El módulo de Punto de Venta no está incluido en tu plan LITE. Haz upgrade a AERO o ZENITH para comenzar a cobrar.'
      );
    }

    // 2. AUDITORÍA DE CAJAS: Traemos TODAS las cajas abiertas actualmente en la empresa
    const openRegisters = await this.cashRegisterRepository.find({
      where: {
        businessId: businessId,
        status: RegisterStatus.OPEN,
      },
      relations: ['user'] // Extraemos a los usuarios para el reporte de error
    });

    // 3. REGLA OPERATIVA: Un mismo cajero no puede abrir dos cajas simultáneas
    const userAlreadyHasOpenRegister = openRegisters.find(reg => reg.userId === user.id);
    if (userAlreadyHasOpenRegister) {
      throw new BadRequestException(
        'Ya tienes un turno activo en este momento. Debes realizar tu corte de caja antes de abrir una nueva.'
      );
    }

    // 4. BARRERA DE MONETIZACIÓN (CAZA): ¿Se alcanzó el límite del plan?
    if (openRegisters.length >= maxCashRegisters) {
      // 🛡️ Extraemos los nombres para decirle al dueño exactamente quién está ocupando las cajas
      const activeOperators = openRegisters
        .map(reg => reg.user?.name || reg.user?.email || 'Usuario')
        .join(', ');

      throw new ForbiddenException(
        `Límite operativo alcanzado. Tu plan actual permite un máximo de ${maxCashRegisters} caja(s) abierta(s) en simultáneo. Actualmente operadas por: ${activeOperators}.`
      );
    }

    // 5. CREACIÓN DEL TURNO (El "Fondo de Caja")
    const newRegister = this.cashRegisterRepository.create({
      businessId: businessId,
      userId: user.id, // Auditoría: Quién la abrió
      openingBalance: Number(openDto.openingBalance),
      expectedBalance: Number(openDto.openingBalance), // 💡 Crucial: Lo que se espera inicia igual al fondo inicial
      status: RegisterStatus.OPEN,
      openedAt: new Date(),
    });

    await this.cashRegisterRepository.save(newRegister);

    return {
      message: 'Bóveda inicializada. Turno operativo activado.',
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

    // 2. CALCULAR EFECTIVO REAL (BILLETES + DEPÓSITOS)
    const salesResult = await this.transactionRepository
      .createQueryBuilder('t')
      // 🛡️ CORRECCIÓN: Usamos snake_case para evitar bugs con getRawOne()
      .select("SUM(CASE WHEN t.paymentMethod = 'CASH' THEN t.total ELSE 0 END)", 'total_sales')
      .where('t.userId = :userId', { userId: user.id })
      .andWhere('t.businessId = :businessId', { businessId: user.businessId })
      .andWhere('t.transactionDate >= :openedAt', { openedAt: register.openedAt })
      .getRawOne();

    // 🛡️ CORRECCIÓN: Leemos exactamente la propiedad que declaramos en el SELECT
    const totalCashIn = parseFloat(salesResult?.total_sales || 0);

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

    // 🛡️ CORRECCIÓN: Ahora usamos nuestra variable limpia `totalCashIn` en lugar de volver a consultar el objeto
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