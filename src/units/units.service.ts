import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class UnitsService {
  constructor(@InjectRepository(Unit) private readonly repo: Repository<Unit>) {}

  async create(dto: CreateUnitDto, user: ActiveUser) {
    const { businessId } = user;

    if (await this.repo.exist({ where: { businessId, symbol: dto.symbol } })) {
      throw new ConflictException(`Ya existe una unidad con símbolo "${dto.symbol}"`);
    }

    if (dto.baseUnitId) {
      const base = await this.findOne(dto.baseUnitId, user);
      if (base.baseUnitId) {
        throw new BadRequestException('La unidad base no puede ser a su vez derivada');
      }
      if (!dto.factor) throw new BadRequestException('Una unidad derivada requiere factor');
    }

    return this.repo.save(
      this.repo.create({
        name: dto.name,
        symbol: dto.symbol,
        businessId,
        baseUnitId: dto.baseUnitId ?? null,
        factor: dto.factor ?? 1,
      }),
    );
  }

  findAll(user: ActiveUser) {
    return this.repo.find({ where: { businessId: user.businessId }, order: { name: 'ASC' } });
  }

  async findOne(id: number, user: ActiveUser) {
    const unit = await this.repo.findOne({ where: { id, businessId: user.businessId } });
    if (!unit) throw new NotFoundException(`Unidad #${id} no encontrada`);
    return unit;
  }

  /** Convierte una cantidad entre dos unidades de la misma familia. */
  async convert(qty: number, fromId: number, toId: number, user: ActiveUser): Promise<number> {
    if (fromId === toId) return qty;
    const [from, to] = await Promise.all([this.findOne(fromId, user), this.findOne(toId, user)]);
    const fromRoot = from.baseUnitId ?? from.id;
    const toRoot = to.baseUnitId ?? to.id;
    if (fromRoot !== toRoot) {
      throw new BadRequestException(`No se puede convertir ${from.symbol} a ${to.symbol}`);
    }
    const inBase = qty * (from.baseUnitId ? from.factor : 1);
    return inBase / (to.baseUnitId ? to.factor : 1);
  }
}