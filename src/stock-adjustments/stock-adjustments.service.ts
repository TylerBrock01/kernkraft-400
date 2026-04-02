import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @InjectRepository(StockAdjustment)
    private readonly adjustmentRepository: Repository<StockAdjustment>,
    private readonly dataSource: DataSource,
  ) {}

  // Nota la firma exacta: businessId es string, userId es number
  async create(createDto: CreateStockAdjustmentDto, businessId: string, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: createDto.productId, businessId: businessId },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado en este negocio.');
      }

      if (product.stock < createDto.quantity) {
        throw new BadRequestException(`Stock insuficiente. Stock actual: ${product.stock}`);
      }

      // Instanciamos explícitamente para que TypeScript sea feliz
      const adjustment = new StockAdjustment();
      adjustment.productId = createDto.productId;
      adjustment.quantity = createDto.quantity;
      adjustment.reason = createDto.reason;
      adjustment.notes = createDto.notes || null;
      adjustment.businessId = businessId;
      adjustment.createdBy = userId;

      const savedAdjustment = await queryRunner.manager.save(adjustment);

      product.stock -= createDto.quantity;
      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      return savedAdjustment;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error procesando el ajuste de inventario.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(businessId: string) {
    return this.adjustmentRepository.find({
      where: { businessId },
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, businessId: string) {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id, businessId },
      relations: ['product', 'user'],
    });

    if (!adjustment) {
      throw new NotFoundException(`El registro de merma con ID ${id} no existe o no pertenece a este negocio.`);
    }

    return adjustment;
  }
}