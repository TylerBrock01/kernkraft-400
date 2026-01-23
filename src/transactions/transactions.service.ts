import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionContent } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';

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
      const total : number = createTransactionDto.contents.reduce((total, item) => total + (item.price * item.quantity), 0);
      transaction.total = total;

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

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
