import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { UnitsService } from '../units/units.service';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material) private readonly repo: Repository<Material>,
    private readonly units: UnitsService,
    private readonly inventory: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMaterialDto, user: ActiveUser) {
    const { businessId } = user;

    const unit = await this.units.findOne(dto.baseUnitId, user);
    if (unit.baseUnitId) {
      throw new ConflictException('La unidad de almacenamiento debe ser una unidad base (kg, l, pza)');
    }
    if (await this.repo.exist({ where: { businessId, sku: dto.sku } })) {
      throw new ConflictException(`Ya existe un material con SKU ${dto.sku}`);
    }

    return this.repo.save(this.repo.create({ ...dto, businessId }));
  }

  findAll(user: ActiveUser) {
    return this.repo.find({ where: { businessId: user.businessId }, order: { name: 'ASC' } });
  }

  async findOne(id: number, user: ActiveUser) {
    const material = await this.repo.findOne({ where: { id, businessId: user.businessId } });
    if (!material) throw new NotFoundException(`Material #${id} no encontrado`);
    return material;
  }

  async update(id: number, dto: UpdateMaterialDto, user: ActiveUser) {
    const material = await this.findOne(id, user);
    return this.repo.save(Object.assign(material, dto));
  }

  /** Entrada de compra: pasa por el libro de movimientos. */
  async receiveStock(id: number, dto: ReceiveStockDto, user: ActiveUser) {
    await this.findOne(id, user);
    return this.dataSource.transaction((manager) =>
      this.inventory.register(manager, {
        businessId: user.businessId,
        materialId: id,
        type: MovementType.PURCHASE,
        direction: 'in',
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        note: dto.note,
        createdBy: String(user.id), // ajusta si ActiveUser expone el id con otro nombre
      }),
    );
  }

  async history(id: number, user: ActiveUser) {
    await this.findOne(id, user);
    return this.inventory.history(user.businessId, id);
  }
}