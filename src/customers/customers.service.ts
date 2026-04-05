import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: CreateCustomerDto, businessId: string) {
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      businessId,
    });
    return this.customerRepository.save(customer);
  }

  async findAll(user: ActiveUser, take: number, skip: number, search?: string) {
    const baseConditions = {
      businessId: user.businessId,
    };

    // 🔍 Búsqueda inteligente: Busca por nombre o por teléfono
    const where: FindOptionsWhere<Customer> | FindOptionsWhere<Customer>[] = search
      ? [
        { ...baseConditions, name: ILike(`%${search}%`) },
        { ...baseConditions, phone: ILike(`%${search}%`) }
      ]
      : baseConditions;

    const [customers, total] = await this.customerRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      take,
      skip
    });

    // Retornamos un objeto estructurado para que el frontend no se pierda
    return { customers, total };
  }

  async findOne(id: number, businessId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id, businessId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, businessId: string) {
    const customer = await this.findOne(id, businessId);
    return this.customerRepository.save({
      ...customer,
      ...updateCustomerDto,
    });
  }
}