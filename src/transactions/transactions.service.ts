import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from './entities/transaction.entity';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContent) private readonly transactionContentRepository: Repository<TransactionContent>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product> ,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    await this.productRepository.manager.transaction(async transactionalEntityManager => {
      const transaction = new Transaction();
      transaction.total = createTransactionDto.contents.reduce((total, item) => total + (item.price * item.quantity), 0);

      for (const contents of createTransactionDto.contents) {
        const product = await transactionalEntityManager.findOneBy(Product, {id: contents.productId});
        const errors = [];

        if(!product){
          errors.push(`Producto ${contents.productId} no encontrado`)
          throw new NotFoundException(errors);
        }
        if(contents.quantity > product.stock){
          errors.push(`No hay stock ${product.name} suficiente`)
          throw new BadRequestException(errors);
        }
        product.stock -= contents.quantity;
        console.log(product);
        // Create transaction content instance
        const transactionContent = new TransactionContent();
        transactionContent.price = contents.price;
        transactionContent.quantity = contents.quantity;
        transactionContent.product = product
        transactionContent.transaction = transaction;

        await transactionalEntityManager.save(product);
        await transactionalEntityManager.save(transaction);
        await transactionalEntityManager.save(transactionContent);
      }
    })

    return 'Sale created successfully'
  }

  findAll(transactionDate?: string) {
    const options : FindManyOptions<Transaction> = {relations: {contents:true}}
    if(transactionDate){
      const date = parseISO(transactionDate)
      if (!isValid(date)) throw new BadRequestException('Date must be valid ISO 8601')
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);
      options.where = {
        transactionDate: Between(startDate, endDate)
      }
    }
    return this.transactionRepository.find(options);
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
