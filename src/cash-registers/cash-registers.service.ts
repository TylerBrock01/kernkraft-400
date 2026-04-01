import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister, RegisterStatus } from './entities/cash-register.entity';
import { OpenRegisterDto } from './dto/open-register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CashRegistersService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
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
}