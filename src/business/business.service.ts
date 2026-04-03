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
      // ⏱️ LÓGICA DE DEMO AUTOMÁTICO
      const licenseExpiration = new Date();
      // Le sumamos exactamente 30 días al momento actual
      licenseExpiration.setDate(licenseExpiration.getDate() + 30);

      // Inyectamos la fecha de caducidad antes de guardar
      const business = this.businessRepository.create({
        ...createBusinessDto,
        licenseValidUntil: licenseExpiration,
      });

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

    // 1. Actualización de estado activo/inactivo
    if (updateDto.isActive !== undefined) {
      business.isActive = updateDto.isActive;
    }

    // 2. Cálculo automático de la nueva fecha de corte
    if (updateDto.monthsToAdd !== undefined) {
      const currentDate = new Date(); // El reloj exacto de la renovación (Hoy)

      // Le sumamos la cantidad de meses solicitados a la fecha actual
      currentDate.setMonth(currentDate.getMonth() + updateDto.monthsToAdd);
      // currentDate.setFullYear(2025,1,1) test para finalizar antes los contratos

      business.licenseValidUntil = currentDate;
    }

    await this.businessRepository.save(business);

    return {
      message: 'Suscripción de la agencia actualizada correctamente.',
      businessId: business.id,
      businessName: business.name,
      isActive: business.isActive,
      licenseValidUntil: business.licenseValidUntil
    };
  }}