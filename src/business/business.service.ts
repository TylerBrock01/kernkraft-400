import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(createBusinessDto: CreateBusinessDto) {
    try {
      const business = this.businessRepository.create(createBusinessDto);
      return await this.businessRepository.save(business);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El nombre o slug del negocio ya existe');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.businessRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business no encontrado');
    return business;
  }
}