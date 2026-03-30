// src/products/products.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // 1. CREAR: Operación atómica vinculada al negocio
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Quita caracteres especiales
      .replace(/[\s_-]+/g, '-') // Cambia espacios por guiones
      .replace(/^-+|-+$/g, ''); // Limpia guiones en las puntas
  }

  // 2. EL MetODO CREATE ACTUALIZADO
  async create(createProductDto: CreateProductDto, businessId: string) {
    // Generamos el slug automáticamente antes de guardar
    const slug = this.generateSlug(createProductDto.name);
    // Dentro del método create, después de generar el slug:
    const existingProduct = await this.productRepository.findOne({
      where: { slug, businessId }
    });

    if (existingProduct) {
      // Si el slug ya existe en ESTE negocio, le añadimos un número aleatorio o lanzamos error
      throw new BadRequestException('Ya tienes un producto con un nombre muy similar.');
    }

    // Creamos la instancia del producto inyectando el businessId y el slug
    const product = this.productRepository.create({
      ...createProductDto,
      slug: slug, // <--- Aquí ocurre la magia
      businessId: businessId,
    });

    return await this.productRepository.save(product);
  }

  // 2. LEER TODO: Filtrado por industria y paginación
  async findAll(
    businessId: string,
    take: number = 10,
    skip: number = 0
  ) {
    const where: FindOptionsWhere<Product> = {
      businessId,
      isActive: true
    };

    const [products, total] = await this.productRepository.findAndCount({
      where,
      order: { id: "DESC" },
      take,
      skip
    });

    return { products, total };
  }

  // 3. LEER UNO: Validación de propiedad estricta
  async findOne(id: number, businessId: string) {
    const product = await this.productRepository.findOne({
      where: { id, businessId }
    });

    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado en este entorno industrial`);
    }
    return product;
  }

  // 4. ACTUALIZAR: Fusión de datos (incluye metadata JSONB)
  async update(id: number, updateProductDto: UpdateProductDto, businessId: string) {
    const product = await this.findOne(id, businessId);

    // Object.assign se encarga de actualizar los campos básicos y el JSONB de metadata
    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  // 5. ELIMINAR: Soft Delete para integridad de datos
  async remove(id: number, businessId: string) {
    const product = await this.findOne(id, businessId);

    product.isActive = false;
    await this.productRepository.save(product);

    return { message: `Producto #${id} desactivado del motor universal` };
  }
}