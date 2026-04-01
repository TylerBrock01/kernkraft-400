import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContent, TransactionStatus } from './entities/transaction.entity';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from '../coupons/coupons.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/roles/roles';

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

    const options: FindManyOptions<Transaction> = {
      // CORRECTO: user y contents son hermanos, ambos hijos de Transaction
      relations: {
        user: true,           // Traemos al vendedor de la transacción
        contents: {
          product: true       // Traemos el producto de cada línea de contenido
        }
      },
      where: {},
      order: { transactionDate: 'DESC' },
      take,
      skip
    };

    // 2. REGLA DE ORO: Si NO es admin, filtramos por su ID.
    // Si ES admin, dejamos el 'where' vacío para que traiga TODO.
    if (user.role !== Role.ADMIN) {
      options.where = { user: { id: user.id } };
    }

    // 3. Filtro de Fecha (manteniendo la seguridad)
    if (transactionDate) {
      const date = parseISO(transactionDate);
      if (!isValid(date)) throw new BadRequestException('Fecha inválida');

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      // Combinamos el filtro de fecha con lo que ya tengamos en 'where' (el user.id si no es admin)
      options.where = {
        ...options.where,
        transactionDate: Between(startDate, endDate)
      };
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(options);

    return {
      transactions,
      total,
      page: Math.ceil(skip / take) + 1
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

  async cancel(id: number, user: User, businessId: string) {
    return await this.transactionRepository.manager.transaction(async (manager) => {

      // 1. BUSQUEDA CON CANDADO: Debe ser del negocio y existir
      const transaction = await manager.findOne(Transaction, {
        where: { id, businessId },
        relations: { contents: { product: true } }
      });

      if (!transaction) throw new NotFoundException(`Transacción #${id} no encontrada.`);

      // 2. REGLA DE NEGOCIO: No cancelar lo ya cancelado
      if (transaction.status === TransactionStatus.CANCELLED) {
        throw new BadRequestException('Esta transacción ya ha sido cancelada anteriormente.');
      }

      // 3. VALIDACIÓN DE TIEMPO (Máximo 30 días para devoluciones)
      const limiteDias = 30;
      const diasTranscurridos = (new Date().getTime() - transaction.transactionDate.getTime()) / (1000 * 3600 * 24);

      if (diasTranscurridos > limiteDias) {
        throw new BadRequestException(`No se pueden cancelar ventas con más de ${limiteDias} días de antigüedad.`);
      }

      // 4. REVERSIÓN DE STOCK (Operación Inversa)
      for (const item of transaction.contents) {
        await manager.increment(
          Product,
          { id: item.productId },
          "stock",
          item.quantity
        );
      }

      // 5. ACTUALIZACIÓN DE ESTADO
      transaction.status = TransactionStatus.CANCELLED;
      await manager.save(transaction);

      return {
        message: `Transacción #${id} cancelada. Inventario restaurado.`,
        previousStatus: TransactionStatus.COMPLETED,
        newStatus: transaction.status
      };
    });
  }
}
