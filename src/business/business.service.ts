import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

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
  // src/business/business.service.ts

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const business = await this.findOne(id); // Validamos que existe primero

    // Fusionamos los cambios
    const updated = this.businessRepository.merge(business, updateBusinessDto);

    try {
      return await this.businessRepository.save(updated);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Ese nombre de negocio ya está ocupado por otro inquilino');
      }
      throw error;
    }
  }
  async toggleStatus(id: string, isActive: boolean) {
    const business = await this.findOne(id); // Reutiliza tu buscador por ID

    business.isActive = isActive;
    const updatedBusiness = await this.businessRepository.save(business);

    // LOG INDUSTRIAL: Es vital saber quién apagó la luz
    console.log(`[KILLSWITCH] Business ${business.name} (${id}) set to isActive: ${isActive}`);

    return {
      message: `Negocio ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        isActive: updatedBusiness.isActive
      }
    };
  }
  // Importa NotFoundException de '@nestjs/common' si no lo tienes
  async updateSubscription(businessId: string, updateDto: UpdateSubscriptionDto) {
    const business = await this.businessRepository.findOne({
      where: { id: businessId }
    });

    if (!business) {
      throw new NotFoundException(`El negocio con ID ${businessId} no existe.`);
    }

    if (updateDto.isActive !== undefined) {
      business.isActive = updateDto.isActive;
    }

    if (updateDto.licenseValidUntil !== undefined) {
      // Convertimos el string ISO a un objeto Date real para TypeORM
      business.licenseValidUntil = new Date(updateDto.licenseValidUntil);
    }

    await this.businessRepository.save(business);

    return {
      message: 'Suscripción de la agencia actualizada correctamente.',
      businessId: business.id,
      businessName: business.name,
      isActive: business.isActive,
      licenseValidUntil: business.licenseValidUntil
    };
  }
}