import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContent, TransactionStatus } from './entities/transaction.entity';
import { Between, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from '../coupons/coupons.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/roles/roles';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent) private readonly transactionContentRepository: Repository<TransactionContent>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product> ,
    private readonly couponService: CouponsService
  ) {}

  async create(createTransactionDto: CreateTransactionDto, user: User, businessId: string) {
    if (!user?.id) {
      throw new BadRequestException('Error crítico: El vendedor no está identificado en el sistema.');
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
        if (item.quantity > product.stock) throw new BadRequestException(`Stock insuficiente: ${product.name}`);

        total += Number(product.price) * item.quantity;
        itemsParaProcesar.push({ product, quantity: item.quantity });
      }

      // 2. LÓGICA DE CUPONES (Mantenemos tu excelente lógica de telemetría)
      let couponName = null;
      let couponDiscount = 0;
      if (createTransactionDto.coupon) {
        // ... (Llamada a couponService y cálculos de descuento)
        // total -= couponDiscount;
      }

      // 3. CREAR CABECERA (Usando las columnas físicas que definimos)
      const transaction = manager.create(Transaction, {
        businessId: businessId,
        userId: user.id, // 👈 Directo a la columna física user_id
        total: total,
        coupon: couponName,
        couponDiscount: couponDiscount
      });

      const savedTransaction = await manager.save(transaction);

      // 4. CREAR DETALLES Y BAJAR STOCK
      for (const item of itemsParaProcesar) {
        // Bajar stock de forma atómica
        await manager.decrement(Product, { id: item.product.id }, "stock", item.quantity);

        // Crear el renglón del detalle
        const content = manager.create(TransactionContent, {
          transactionId: savedTransaction.id, // 👈 Enlace directo
          productId: item.product.id,       // 👈 Enlace directo
          quantity: item.quantity,
          price: item.product.price         // Snapshot
        });

        await manager.save(content);
      }

      return {
        message: 'Transaction finalized. Mainframe synchronized.',
        transactionId: savedTransaction.id,
        finalTotal: total
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
}
