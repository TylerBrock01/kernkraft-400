import { Injectable, NotFoundException } from '@nestjs/common';
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
    // 🔍 Buscamos la transacción con sus relaciones (productos)
    const transaction = await this.transactionRepository.findOne({
      where: { uuid },
      relations: ['contents', 'contents.product'], // Traemos el detalle y el nombre del producto
    });

    if (!transaction) {
      throw new NotFoundException('El ticket solicitado no existe o ha caducado.');
    }

    // 🏢 Buscamos la info del negocio para el encabezado del ticket
    const business = await this.businessRepository.findOne({
      where: { id: transaction.businessId },
    });

    // 📦 Formateamos el "Paquete de Datos" para el Frontend
    return {
      header: {
        businessName: business?.name || 'Comercio MCU',
        // 🧠 MAGIA JSONB: Extraemos los datos de contacto desde la configuración
        email: business?.config?.email || null,
        phone: business?.config?.phone || null,
        address: business?.config?.address || null,
        // -----------------------------------------------------------------
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
        // También podemos dejar que cada negocio personalice su mensaje final en el config
        message: business?.config?.ticketMessage || '¡Gracias por su preferencia!',
        uuid: transaction.uuid,
      },
    };
  };
}