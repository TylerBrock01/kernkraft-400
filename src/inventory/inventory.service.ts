import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { Material } from '../materials/entities/material.entity';
import { RegisterMovementInput } from './dto/register-movement.dto';

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement) private readonly movements: Repository<StockMovement>,
  ) {}

  /** Único punto de entrada para modificar stock. Participa en la transacción del llamador. */
  async register(manager: EntityManager, input: RegisterMovementInput): Promise<StockMovement> {
    if (input.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

    const material = await manager.findOne(Material, {
      where: { id: input.materialId, businessId: input.businessId },
      lock: { mode: 'pessimistic_write' },
      loadEagerRelations: false, // CORRECCIÓN: con eager, el JOIN rompe el FOR UPDATE en PostgreSQL
    });
    if (!material) throw new NotFoundException('Material no encontrado');

    const signed = input.direction === 'in' ? input.quantity : -input.quantity;
    const newStock = round6(material.stock + signed);

    if (newStock < 0 && !material.allowNegativeStock) {
      throw new BadRequestException(
        `Stock insuficiente de "${material.name}": hay ${material.stock}, se requieren ${input.quantity}`,
      );
    }

    let unitCost = material.avgCost;
    if (input.direction === 'in') {
      unitCost = input.unitCost ?? material.avgCost;
      const totalValue = material.stock * material.avgCost + input.quantity * unitCost;
      material.avgCost = newStock > 0 ? round6(totalValue / newStock) : unitCost;
    }

    material.stock = newStock;
    await manager.save(material);

    return manager.save(
      manager.create(StockMovement, {
        businessId: input.businessId,
        materialId: input.materialId,
        type: input.type,
        quantity: signed,
        unitCost,
        balanceAfter: newStock,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        note: input.note ?? null,
        createdBy: input.createdBy ?? null,
      }),
    );
  }

  history(businessId: string, materialId: number) {
    return this.movements.find({
      where: { businessId, materialId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}