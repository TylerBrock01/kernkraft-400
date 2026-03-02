import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from './entities/transaction.entity';
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

  async create(createTransactionDto: CreateTransactionDto, user: User) {
    return await this.productRepository.manager.transaction(async (manager) => {

      // 1. CÁLCULO INICIAL DE TELEMETRÍA (Bruto)
      let total = 0;
      const itemsParaProcesar = [];

      for (const item of createTransactionDto.contents) {
        const product = await manager.findOneBy(Product, { id: item.productId });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        if (item.quantity > product.stock) throw new BadRequestException(`No hay stock de ${product.name}`);

        total += Number(product.price) * item.quantity;
        itemsParaProcesar.push({ product, quantity: item.quantity });
      }

      // 2. PROTOCOLO DE CUPONES: Validación y Cálculo
      let couponName = null;
      let couponDiscount = 0;

      if (createTransactionDto.coupon) {
        // Inyectamos el total actual para validar compra mínima en el Service
        const res = await this.couponService.applyCoupon({
          coupon_name: createTransactionDto.coupon,
          total: total // 👈 Validación minPurchase blindada
        });

        // Lógica de Descuento Dual (Fijo vs Porcentual)
        if (res.coupon.isPercentage) {
          couponDiscount = (res.coupon.discount / 100) * total;
        } else {
          // Aseguramos que el descuento no sea mayor que el total (Seguridad CAZA)
          couponDiscount = Math.min(res.coupon.discount, total);
        }

        couponName = res.coupon.name;
        total -= couponDiscount;

        // 3. CONSUMO DE HARDWARE (CUPÓN)
        // Lo marcamos como usado dentro de la transacción
        await this.couponService.confirmCouponUsage(couponName);
      }

      // 4. INSERT DE LA TRANSACCIÓN
      const nuevaTransaccion = await manager.insert(Transaction, {
        total: total,
        coupon: couponName,
        couponDiscount: couponDiscount,
        user: { id: user.id }
      });

      const transactionId = nuevaTransaccion.identifiers[0].id;

      // 5. ACTUALIZACIÓN DE STOCK Y DETALLES
      for (const item of itemsParaProcesar) {
        await manager.update(Product, item.product.id, {
          stock: item.product.stock - item.quantity
        });

        await manager.insert(TransactionContent, {
          price: item.product.price,
          quantity: item.quantity,
          product: { id: item.product.id },
          transaction: { id: transactionId }
        });
      }

      return {
        message: 'Sale created successfully. Mainframe updated.',
        transactionId,
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
}
