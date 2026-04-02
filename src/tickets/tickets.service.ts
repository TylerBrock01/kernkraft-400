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
    // 1. Buscamos la transacción con todas sus relaciones clave
    const transaction = await this.transactionRepository.findOne({
      where: { uuid },
      // ✨ NUEVO: Agregamos al usuario (cajero) y al cliente a la consulta
      relations: ['contents', 'contents.product', 'user', 'customer'],
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

    // 4. Matemáticas Claras (Calculamos desde cero para evitar errores de doble descuento)
    const subtotalItems = transaction.contents.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const discount = Number(transaction.couponDiscount || 0);
    const deposit = Number(transaction.depositAmount || 0);
    const grandTotal = (subtotalItems - discount) + deposit;

    // 5. Formateamos el "Paquete de Datos"
    return {
      header: {
        businessName: business?.name || 'Comercio MCU',
        email: business?.config?.email || null,
        phone: business?.config?.phone || null,
        address: business?.config?.address || null,
        date: transaction.transactionDate,
        transactionId: transaction.id,
        status: transaction.status,
        attendedBy: transaction.user?.email || 'Cajero', // ✨ Mostramos quién cobró
      },
      // ✨ NUEVO: Datos del cliente para contratos de renta
      customer: transaction.customer ? {
        name: transaction.customer.name,
        phone: transaction.customer.phone,
        // email: transaction.customer.email || null
      } : null,
      details: {
        type: transaction.type,
        rentalStatus: transaction.rentalStatus, // ✨ Si está 'OUT' o ya fue 'RETURNED'
        items: transaction.contents.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          subtotal: Number(item.price) * item.quantity,
        })),
      },
      financials: {
        subtotal: subtotalItems,
        discount: discount,
        deposit: deposit,
        grandTotal: grandTotal,
        paymentMethod: transaction.paymentMethod, // ✨ Transparencia financiera para el cliente
        returnDate: transaction.returnDate,
      },
      footer: {
        message: business?.config?.ticketMessage || '¡Gracias por su preferencia!',
        uuid: transaction.uuid,
      },
    };
  }
}