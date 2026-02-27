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

      // 1. Calculamos el total primero (Pura lógica, nada de DB aún)
      let total = 0;
      const itemsParaProcesar = [];

      for (const item of createTransactionDto.contents) {
        const product = await manager.findOneBy(Product, { id: item.productId });
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        if (item.quantity > product.stock) throw new BadRequestException(`No hay stock de ${product.name}`);

        total += Number(product.price) * item.quantity;
        itemsParaProcesar.push({ product, quantity: item.quantity });
      }

      // 2. Aplicar cupones si existen
      let couponName = null;
      let couponDiscount = 0;
      if (createTransactionDto.coupon) {
        const res = await this.couponService.applyCoupon(createTransactionDto.coupon);
        couponDiscount = (res.coupon.discount / 100) * total;
        couponName = res.coupon.name;
        total -= couponDiscount;
      }

      // 3. INSERT de la Transacción (Usamos .insert para evitar el UpdateValuesMissingError)
      // Al usar insert, TypeORM no intenta "adivinar", simplemente dispara la consulta.
      const nuevaTransaccion = await manager.insert(Transaction, {
        total: total,
        coupon: couponName,
        couponDiscount: couponDiscount,
        user: { id: user.id } // Solo necesitamos el ID para la relación
      });

      const transactionId = nuevaTransaccion.identifiers[0].id;

      // 4. Procesamos productos y sus contenidos
      for (const item of itemsParaProcesar) {
        // Actualizamos el stock directamente en la BD (Más seguro y rápido)
        await manager.update(Product, item.product.id, {
          stock: item.product.stock - item.quantity
        });

        // Insertamos el detalle de la venta
        await manager.insert(TransactionContent, {
          price: item.product.price,
          quantity: item.quantity,
          product: { id: item.product.id },
          transaction: { id: transactionId }
        });
      }

      return { message: 'Sale created successfully', transactionId };
    });
  }

  async findAll(user: User, transactionDate?: string, take: number = 10, skip: number = 0) {
    // 1. Iniciamos las opciones con el filtro de usuario SIEMPRE presente
    const options: FindManyOptions<Transaction> = {
      relations: { contents: { product: true } }, // Cargamos productos para ver qué se vendió
      where: {
        user: { id: user.id } // Seguridad: El usuario solo ve lo suyo
      },
      order: { transactionDate: 'DESC' },
      take,
      skip
    };

    // 2. Si hay fecha, extendemos el objeto 'where' sin borrar el 'user'
    if (transactionDate) {
      const date = parseISO(transactionDate);
      if (!isValid(date)) throw new BadRequestException('La fecha debe ser un formato ISO 8601 válido');

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      // Usamos el operador spread (...) para mantener el filtro de user.id
      options.where = {
        ...options.where as object,
        transactionDate: Between(startDate, endDate)
      };
    }

    // 3. Usamos findAndCount para facilitar la paginación en el frontend de la Skate Shop
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
