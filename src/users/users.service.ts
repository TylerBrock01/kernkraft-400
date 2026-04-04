// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { PLAN_LIMITS } from '../business/config/plan-limits.config';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { ActiveUser } from '../auth/classes/active-user.class';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, adminPlan?: SubscriptionPlan) {
    const { email, businessId } = createUserDto;

    // 1. EL MURO DE PAGO (Solo se activa si enviamos un plan, es decir, si es un empleado creando la cuenta)
    if (adminPlan) {
      const maxUsers = PLAN_LIMITS[adminPlan].maxUsers;

      if (maxUsers !== -1) {
        const currentUsersCount = await this.userRepository.count({
          where: { businessId }
        });

        if (currentUsersCount >= maxUsers) {
          throw new ForbiddenException(
            `Límite alcanzado: Tu plan (${adminPlan}) permite máximo ${maxUsers} usuarios.`
          );
        }
      }
    }

    // 2. Verificación de duplicados
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado en el motor');
    }

    // 3. Creación
    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  // LOGIN: Traemos el businessId para inyectarlo en el JWT
  async findOneWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email, isActive: true },
      select: ['id', 'name', 'password', 'role', 'businessId', 'email'],
      // ✨ ESTO ES LO QUE FALTA: Traernos el negocio y su plan
      relations: ['business'],
    });
  }

  // READ ALL: Solo los usuarios de MI negocio
  async findAll(user: ActiveUser,take: number, skip: number,search?: string) {

    // 1. La regla de oro: NUNCA romper el aislamiento del Tenant (businessId)
    const baseConditions = {
      businessId: user.businessId,
      // isActive: true
    };
    // 2. Construimos la consulta dinámicamente
    // Si TypeORM recibe un arreglo [], lo interpreta como un "OR" (O una cosa, O la otra)
    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = search
      ? [
        // Búsqueda en el Nombre (Respetando siempre el businessId)
        { ...baseConditions, name: ILike(`%${search}%`) },
        // Búsqueda en la Descripción
        { ...baseConditions, email: ILike(`%${search}%`) }
      ]
      : baseConditions; // Si no hay búsqueda, traemos todo normal

    const [users, total] = await this.userRepository.findAndCount({
      where,
      order: { id: "DESC" },
      take,
      skip
    });
    return { users, total };
  }

  // READ ONE: Verificación de propiedad (ID + BusinessId)
  async findOne(id: number, businessId: string) {
    const user = await this.userRepository.findOne({
      where: { id, businessId }
    });

    if (!user) {
      throw new NotFoundException(`Usuario #${id} no encontrado en su organización`);
    }
    return user;
  }

  // UPDATE: Solo si el usuario pertenece al negocio del administrador
  async update(id: number, updateUserDto: UpdateUserDto, businessId: string) {
    const user = await this.findOne(id, businessId); // Reutilizamos findOne para validar propiedad

    // Protegemos el businessId para que no se pueda cambiar de empresa vía UPDATE
    const { businessId: _, ...updateData } = updateUserDto;

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  // REMOVE: Soft Delete industrial
  async remove(id: number, businessId: string) {
    const user = await this.findOne(id, businessId);

    user.isActive = false; // Mantenemos el registro por auditoría, pero lo desactivamos
    return await this.userRepository.save(user);
  }
}