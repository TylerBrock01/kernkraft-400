import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Business } from '../business/entities/business.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findOneByUuid(uuid: string) {
    // 1. Buscamos la transacción
    const transaction = await this.transactionRepository.findOne({
      where: { uuid },
      relations: ['contents', 'contents.product'],
    });

    if (!transaction) {
      throw new NotFoundException('El ticket solicitado no existe o ha caducado.');
    }

    // 2. Buscamos el negocio dueño de esta transacción
    const business = await this.businessRepository.findOne({
      where: { id: transaction.businessId },
    });

    // 3. LA REGLA SAAS: Validar suscripción activa
    if (business && !business.isActive) {
      throw new ForbiddenException('Este recibo no está disponible temporalmente. El comercio asociado se encuentra inactivo.');
    }

    // 4. Formateamos el "Paquete de Datos"
    return {
      header: {
        businessName: business?.name || 'Comercio MCU',
        email: business?.config?.email || null,
        phone: business?.config?.phone || null,
        address: business?.config?.address || null,
        date: transaction.transactionDate,
        transactionId: transaction.id,
        status: transaction.status,
      },
      details: {
        type: transaction.type,
        items: transaction.contents.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: Number(item.price) * item.quantity,
        })),
      },
      financials: {
        subtotal: transaction.total,
        discount: transaction.couponDiscount,
        deposit: transaction.depositAmount,
        totalPaid: Number(transaction.total) + Number(transaction.depositAmount) - Number(transaction.couponDiscount),
        returnDate: transaction.returnDate,
      },
      footer: {
        message: business?.config?.ticketMessage || '¡Gracias por su preferencia!',
        uuid: transaction.uuid,
      },
    };
  }
}