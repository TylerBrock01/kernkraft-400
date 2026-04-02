import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethod, RentalStatus, Transaction, TransactionContent, TransactionStatus, TransactionType } from './entities/transaction.entity';
import { Between, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from '../coupons/coupons.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/roles/roles';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { AdjustmentReason, StockAdjustment } from '../stock-adjustments/entities/stock-adjustment.entity';
import { RefundSaleDto } from './dto/refund-sale.dto';
import { CashRegister, RegisterStatus } from '../cash-registers/entities/cash-register.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent) private readonly transactionContentRepository: Repository<TransactionContent>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product> ,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,

  ) {}
  async create(createTransactionDto: CreateTransactionDto, user: User, businessId: string) {
    if (!user?.id) {
      throw new BadRequestException('Error crítico: El vendedor no está identificado en el sistema.');
    }
    const openShift = await this.cashRegisterRepository.findOne({
      where: {
        userId: user.id,
        businessId: businessId,
        status: RegisterStatus.OPEN,
      },
    });

    if (!openShift) {
      throw new BadRequestException(
        'Operación denegada: Debes abrir tu turno de caja (Cash Register) antes de procesar ventas o rentas.'
      );
    }
    // ⛺ VALIDACIÓN PREVIA DE RENTA
    const isRental = createTransactionDto.type === TransactionType.RENTAL;
    if (isRental && !createTransactionDto.returnDate) {
      throw new BadRequestException('Operación denegada: Las rentas exigen una fecha de devolución (returnDate).');
    }

    return await this.transactionRepository.manager.transaction(async (manager) => {
      let total = 0;
      const itemsParaProcesar = [];

      // 1. ESCANEO DE PRODUCTOS (Seguridad Multi-tenant)
      for (const item of createTransactionDto.contents) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId, businessId: businessId }
        });

        if (!product) throw new NotFoundException(`Producto #${item.productId} no disponible`);
        if (item.quantity > product.stock) throw new BadRequestException(`Stock insuficiente para: ${product.name}`);

        // El total siempre es el precio del producto * cantidad (Ganancia pura)
        total += Number(product.price) * item.quantity;
        itemsParaProcesar.push({ product, quantity: item.quantity });
      }

      // 2. LÓGICA DE CUPONES
      let couponName = null;
      let couponDiscount = 0;

      if (createTransactionDto.coupon) {
        // Buscamos el cupón dentro de esta misma transacción de base de datos
        const coupon = await manager.findOne(Coupon, {
          where: {
            name: createTransactionDto.coupon,
            businessId: businessId
          }
        });

        // 🛡️ Batería de validaciones financieras
        if (!coupon) throw new BadRequestException(`El cupón "${createTransactionDto.coupon}" no existe en este negocio.`);
        if (!coupon.isActive) throw new BadRequestException('Este cupón ha sido desactivado manualmente.');
        if (new Date() > coupon.expirationDate) throw new BadRequestException('El cupón ha expirado.');
        if (coupon.limit > 0 && coupon.used >= coupon.limit) throw new BadRequestException('El cupón alcanzó su límite de usos permitidos.');
        if (total < coupon.minPurchase) throw new BadRequestException(`Este cupón requiere una compra mínima de $${coupon.minPurchase}.`);

        // 🧮 Matemáticas del descuento
        if (coupon.isPercentage) {
          couponDiscount = total * (Number(coupon.discount) / 100);
        } else {
          couponDiscount = Number(coupon.discount);
        }

        // Tope de seguridad: No regalar dinero si el descuento supera el total
        if (couponDiscount > total) {
          couponDiscount = total;
        }

        // 📉 Ajustamos el dinero a cobrar
        total -= couponDiscount;
        couponName = coupon.name;

        // 🔐 INCREMENTO SEGURO DEL USO (Manejando concurrencia)
        await manager.increment(Coupon, { id: coupon.id }, 'used', 1);
        }

      // 3. CREAR CABECERA (Inyección del ADN Híbrido)
      const deposit = isRental ? (createTransactionDto.depositAmount || 0) : 0;

      // 3. CREAR CABECERA DE LA TRANSACCIÓN
      const transaction = manager.create(Transaction, {
        businessId: businessId,
        userId: user.id,
        type: createTransactionDto.type,
        customerId: createTransactionDto.customerId,
        returnDate: createTransactionDto.returnDate,
        depositAmount: createTransactionDto.depositAmount || 0,
        total: total,
        coupon: couponName,
        couponDiscount: couponDiscount,

        // ✨ EL PARCHE VITAL: Guardar el método de pago que manda el frontend,
        // o usar CASH por defecto si no mandan nada.
        paymentMethod: createTransactionDto.paymentMethod || PaymentMethod.CASH
      });

      const savedTransaction = await manager.save(transaction);

      // 4. CREAR DETALLES Y BAJAR STOCK
      for (const item of itemsParaProcesar) {
        // 📦 Bajamos el stock en AMBOS casos. Si es venta, se fue. Si es renta, el cliente lo tiene físicamente.
        await manager.decrement(Product, { id: item.product.id }, "stock", item.quantity);

        const content = manager.create(TransactionContent, {
          transactionId: savedTransaction.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        });

        await manager.save(content);
      }

      // 5. CÁLCULO FINAL PARA EL CAJERO
      const grandTotal = total - couponDiscount + deposit;

      return {
        message: isRental ? 'Renta activa. Equipo fuera de almacén.' : 'Venta procesada. Mainframe sincronizado.',
        transactionId: savedTransaction.id,
        type: savedTransaction.type,

        // 💵 Desglose financiero claro para el frontend/ticket
        financials: {
          subtotal: total,
          discount: couponDiscount,
          depositRetained: deposit,
          grandTotalToCharge: grandTotal // 👈 Lo que el cliente debe pagar hoy en mostrador
        },

        returnDate: savedTransaction.returnDate
      };
    });
  }

  async findAll(user: User, transactionDate?: string, take: number = 10, skip: number = 0) {

    // 1. EL CANDADO BASE (Multi-tenancy)
    // Nadie sale de su propio negocio, sea admin o no.
    const baseWhere: FindOptionsWhere<Transaction> = {
      businessId: user.businessId
    };

    // 2. REGLA DE ROL (Filtro de Vendedor)
    // Si no es ADMIN, solo ve lo que él mismo vendió.
    if (user.role !== Role.ADMIN) {
      baseWhere.userId = user.id; // Usamos la columna física userId que definimos
    }

    // 3. FILTRO DE FECHA
    if (transactionDate) {
      const date = parseISO(transactionDate);
      if (!isValid(date)) throw new BadRequestException('Fecha inválida');

      baseWhere.transactionDate = Between(
        startOfDay(date),
        endOfDay(date)
      );
    }

    // 4. EJECUCIÓN CON RELACIONES
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: baseWhere,
      relations: {
        user: true,           // Quién vendió
        contents: {
          product: true       // Qué vendió
        }
      },
      order: { transactionDate: 'DESC' },
      take,
      skip
    });

    return {
      transactions,
      total,
      page: Math.ceil(skip / take) + 1,
      businessId: user.businessId // Para confirmar el aislamiento en el frontend
    };
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOne({where :{ id},relations: {contents:true}})
    console.log(transaction);
    if(!transaction){
      throw new NotFoundException(`Transaction #${id} not found`)
    }
    return transaction;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  async remove(id: number) {
    const transaction = await this.findOne(id);

    for (const contents of transaction.contents) {
      const product = await this.productRepository.findOneBy({id: contents.product.id});
      product.stock += contents.quantity;
      await this.productRepository.save(product);
      const transactionContents = await this.transactionContentRepository.findOneBy({id: contents.id});
      await this.transactionContentRepository.remove(transactionContents)

    }
    await this.transactionRepository.remove(transaction);
    return {message: 'Transaction deleted successfully'};
  }

  async cancel(id: number, user: User, businessId: string, reason?: string) {
    return await this.transactionRepository.manager.transaction(async (manager) => {

      // 1. BÚSQUEDA Y VALIDACIÓN (Aquí se define 'transaction')
      // Es vital cargar las 'contents' para saber qué productos devolver al stock
      const transaction = await manager.findOne(Transaction, {
        where: {
          id,
          businessId // 🛡️ Seguridad Multi-tenant: Solo puedes cancelar lo tuyo
        },
        relations: {
          contents: true // Cargamos los productos vendidos
        }
      });

      if (!transaction) {
        throw new NotFoundException(`La transacción #${id} no existe en este negocio.`);
      }

      if (transaction.status === TransactionStatus.CANCELLED) {
        throw new BadRequestException('Esta transacción ya fue cancelada previamente.');
      }

      // 2. REVERSIÓN DE STOCK
      // Recorremos los contenidos que cargamos en el paso 1
      for (const item of transaction.contents) {
        await manager.increment(
          Product,
          { id: item.productId },
          "stock",
          item.quantity
        );
      }

      // 3. ACTUALIZACIÓN DE ESTADO
      transaction.status = TransactionStatus.CANCELLED;
      await manager.save(transaction);

      // 4. REGISTRO EN EL MAINFRAME DE AUDITORÍA 🛡️
      // Usamos manager.insert para que sea atómico y rápido
      // 4. REGISTRO EN EL MAINFRAME DE AUDITORÍA 🛡️
      // 4. REGISTRO EN EL MAINFRAME DE AUDITORÍA 🛡️
      await manager.insert(AuditLog, {
        businessId,
        userId: user.id,
        action: 'TRANSACTION_CANCELLED',
        entityId: id.toString(),
        details: {
          reason: reason || 'No especificada',
          totalReverted: +transaction.total, // El '+' es un atajo para Number()
          timestamp: new Date().toISOString(),
        } as any, // 👈 ESTO elimina el error de incompatibilidad de un plumazo
      });

      return {
        message: `Venta #${id} anulada con éxito. Inventario restaurado.`,
        transactionId: id,
        status: transaction.status
      };
    });
  }

  async returnRental(transactionId: number, returnDto: ReturnRentalDto, user: User, businessId: string) {
    return await this.transactionRepository.manager.transaction(async (manager) => {

      // 1. BUSCAR EL CONTRATO Y BLINDARLO
      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId, businessId: businessId }
      });

      if (!transaction) throw new NotFoundException(`Contrato de renta #${transactionId} no encontrado.`);
      if (transaction.type !== TransactionType.RENTAL) throw new BadRequestException('Error: Este ticket es una venta normal, no hay nada que devolver.');
      if (transaction.rentalStatus === RentalStatus.RETURNED) throw new BadRequestException('Alerta: Este equipo ya fue devuelto y procesado anteriormente.');

      // 2. CONTABILIDAD DE DAÑOS Y PENALIZACIONES
      const penalty = returnDto.penaltyAmount || 0;

      if (penalty > transaction.depositAmount) {
        throw new BadRequestException(`Operación rechazada: No puedes cobrar una penalidad ($${penalty}) mayor al depósito retenido ($${transaction.depositAmount}).`);
      }

      const refundAmount = transaction.depositAmount - penalty;

      // 💸 AJUSTE CONTABLE REAL:
      // El total ahora debe reflejar lo que el negocio se quedó al final:
      // Renta Original + Penalidad.
      transaction.total = Number(transaction.total) + penalty;

      // El depósito ya no está en la caja (o se devolvió o se volvió penalidad)
      // Para que el QueryBuilder no lo sume otra vez, lo "vaciamos" porque ya se procesó.
      transaction.depositAmount = 0;

      // 3. RECUPERACIÓN DE INVENTARIO Y MERMAS (CORREGIDO)
      const contents = await manager.find(TransactionContent, {
        where: { transactionId: transaction.id }
      });

      // Mapeamos los daños enviados en el DTO para buscarlos fácil
      const damagesMap = new Map<number, number>();
      if (returnDto.damagedItems) {
        returnDto.damagedItems.forEach(item => damagesMap.set(item.productId, item.quantity));
      }

      for (const item of contents) {
        // Revisamos si este producto en particular tuvo mermas
        const damagedQty = damagesMap.get(item.productId) || 0;

        // Aseguramos que no reporten más daños de los que rentaron
        const validDamagedQty = Math.min(damagedQty, item.quantity);
        const intactQuantity = item.quantity - validDamagedQty;

        if (intactQuantity > 0) {
          // 📦 Restauramos el stock sano a la bodega
          await manager.increment(Product, { id: item.productId }, "stock", intactQuantity);
        }

        // 🚨 Registramos la merma de este producto específico
        if (validDamagedQty > 0) {
          // Importante: Asegúrate de importar StockAdjustment y AdjustmentReason arriba
          const adjustment = manager.create(StockAdjustment, {
            businessId: businessId,
            productId: item.productId,
            quantity: validDamagedQty,
            reason: AdjustmentReason.DAMAGE,
            notes: `Merma automática (Contrato #${transaction.id}). Razón: ${returnDto.penaltyReason || 'Daño en renta'}`,
            createdBy: user.id, // Ojo: asegúrate de que user.id sea number como vimos hace rato
          });
          await manager.save(adjustment);
        }
      }
      // 4. SELLAR EL CONTRATO
      transaction.rentalStatus = RentalStatus.RETURNED;
      await manager.save(transaction);

      // 5. REPORTE FINANCIERO AL CAJERO
      return {
        message: 'Equipo devuelto. Contrato cerrado e inventario restaurado.',
        transactionId: transaction.id,
        financials: {
          originalDeposit: transaction.depositAmount,
          penaltyApplied: penalty,
          penaltyReason: returnDto.penaltyReason || 'Devolución limpia',
          refundToCustomer: refundAmount, // 👈 Lo que el cajero saca de la caja para darle al cliente
          newTotalRevenue: transaction.total // Ganancia actualizada del ticket
        }
      };
    });
  }

  async refundSale(transactionId: number, refundDto: RefundSaleDto, user: User, businessId: string) {
    return await this.transactionRepository.manager.transaction(async (manager) => {

      // 1. BUSCAR Y BLINDAR EL TICKET
      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId, businessId: businessId },
        relations: ['contents'] // Traemos el detalle de la compra original
      });

      if (!transaction) throw new NotFoundException(`Ticket #${transactionId} no encontrado.`);
      if (transaction.type !== TransactionType.SALE) throw new BadRequestException('Este ticket es de renta. Usa el módulo de devoluciones de renta.');
      if (transaction.status === TransactionStatus.REFUNDED) throw new BadRequestException('Este ticket ya fue reembolsado en su totalidad.');

      let totalRefundAmount = 0;

      // 2. PROCESAR CADA ARTÍCULO DEVUELTO
      for (const refundItem of refundDto.items) {
        // Buscamos si el cliente realmente compró este producto en este ticket
        const contentRow = transaction.contents.find(c => c.productId === refundItem.productId);

        if (!contentRow) {
          throw new BadRequestException(`El producto #${refundItem.productId} no pertenece a este ticket.`);
        }

        if (refundItem.quantityToReturn > contentRow.quantity) {
          throw new BadRequestException(`No puedes devolver más unidades de las que se compraron (${contentRow.quantity}).`);
        }

        // --- A. MATEMÁTICA FINANCIERA ---
        // Calculamos cuánto dinero hay que regresarle al cliente basado en el precio al que compró
        const itemRefundValue = Number(contentRow.price) * refundItem.quantityToReturn;
        totalRefundAmount += itemRefundValue;

        // --- B. LOGÍSTICA DE INVENTARIO Y MERMAS (DRY) ---
        // Aplicamos la misma lógica infalible que usamos en las rentas
        const defectiveQty = Math.min(refundItem.defectiveQuantity, refundItem.quantityToReturn);
        const intactQty = refundItem.quantityToReturn - defectiveQty;

        if (intactQty > 0) {
          // 📦 El producto está bueno, vuelve a la repisa para venderse de nuevo
          await manager.increment(Product, { id: refundItem.productId }, "stock", intactQty);
        }

        if (defectiveQty > 0) {
          // 🚨 El producto no sirve, se va directo a mermas
          const adjustment = manager.create(StockAdjustment, {
            businessId: businessId,
            productId: refundItem.productId,
            quantity: defectiveQty,
            reason: AdjustmentReason.DAMAGE,
            notes: `Devolución defectuosa (Ticket #${transaction.id}). Razón: ${refundDto.reason || 'No especificada'}`,
            createdBy: user.id,
          });
          await manager.save(adjustment);
        }

        // --- C. MUTACIÓN DEL TICKET ---
        contentRow.quantity -= refundItem.quantityToReturn;

        if (contentRow.quantity === 0) {
          // Si devolvió todos los mouses, borramos ese renglón del ticket
          await manager.remove(contentRow);
        } else {
          // Si compró 2 y devolvió 1, guardamos que ahora solo compró 1
          await manager.save(contentRow);
        }
      }

      // 3. ACTUALIZAR EL TOTAL DEL TICKET
      transaction.total = Number(transaction.total) - totalRefundAmount;

      // Si el ticket quedó en $0, cambiamos el estatus para que la analítica no lo cuente
      if (transaction.total <= 0) {
        transaction.status = TransactionStatus.REFUNDED;
        transaction.total = 0;
      }

      await manager.save(transaction);

      // 4. REPORTE PARA EL CAJERO
      return {
        message: 'Reembolso procesado correctamente.',
        transactionId: transaction.id,
        newTicketStatus: transaction.status,
        financials: {
          cashToReturnToCustomer: totalRefundAmount, // 👈 Lo que el cajero debe sacar de la caja
          newTicketTotal: transaction.total // La ganancia que sí se quedó el negocio
        }
      };
    });
  }
}
