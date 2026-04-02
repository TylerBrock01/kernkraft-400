import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

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

  findAll(businessId: string) {
    return this.customerRepository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
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