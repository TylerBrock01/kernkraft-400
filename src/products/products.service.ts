// src/products/products.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { ActiveUser } from '../auth/classes/active-user.class';
import { PLAN_LIMITS } from '../business/config/plan-limits.config';
import { UploadImageService } from '../upload-image/upload-image.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly uploadImageService: UploadImageService,
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
  async create(createProductDto: CreateProductDto, user: ActiveUser, file?: Express.Multer.File) {
    // 1. EL MURO DE PAGO (Este código se queda exactamente igual)
    const maxProducts = PLAN_LIMITS[user.plan].maxProducts;
    if (maxProducts !== -1) {
      const currentProductsCount = await this.productRepository.count({
        where: { businessId: user.businessId }
      });
      if (currentProductsCount >= maxProducts) {
        throw new ForbiddenException(`Catálogo lleno...`);
      }
    }

    // ✨ 2. PROCESAMIENTO DE IMAGEN
    if (file) {
      try {
        const uploadedImage = await this.uploadImageService.uploadFile(file);
        // Si todo sale bien, metemos la URL de Cloudinary al DTO
        createProductDto.image = uploadedImage.secure_url;
      } catch (error) {
        throw new BadRequestException('Hubo un error al subir la imagen a la nube.');
      }
    }

    // 3. Generamos el slug automáticamente
    const slug = this.generateSlug(createProductDto.name);

    // 4. Verificamos duplicados
    const existingProduct = await this.productRepository.findOne({
      where: { slug, businessId: user.businessId }
    });

    if (existingProduct) {
      throw new BadRequestException('Ya tienes un producto con un nombre muy similar.');
    }

    // 5. Guardamos (Aquí createProductDto ya lleva la URL de la imagen adentro)
    const product = this.productRepository.create({
      ...createProductDto,
      slug: slug,
      businessId: user.businessId,
    });

    return await this.productRepository.save(product);
  }

  // 2. LEER TODO: Filtrado por industria y paginación
  async findAll(user: ActiveUser, take: number = 10, skip: number = 0, search?: string) {
    // 1. La regla de oro: NUNCA romper el aislamiento del Tenant (businessId)
    const baseConditions = {
      businessId: user.businessId,
      isActive: true
    };

    // 2. Construimos la consulta dinámicamente
    // Si TypeORM recibe un arreglo [], lo interpreta como un "OR" (O una cosa, O la otra)
    const where: FindOptionsWhere<Product> | FindOptionsWhere<Product>[] = search
      ? [
        // Búsqueda en el Nombre (Respetando siempre el businessId)
        { ...baseConditions, name: ILike(`%${search}%`) },
        // Búsqueda en la Descripción
        { ...baseConditions, description: ILike(`%${search}%`) }
      ]
      : baseConditions; // Si no hay búsqueda, traemos todo normal

    // 3. Ejecutamos la orden en la base de datos
    const [products, total] = await this.productRepository.findAndCount({
      where,
      order: { id: "DESC" },
      take,
      skip
    });

    return { products, total };
  }

  // 3. LEER UNO: Validación de propiedad estricta
  async findOne(id: number, user: ActiveUser) {
    const product = await this.productRepository.findOne({
      where: { id, businessId: user.businessId}
    });

    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado en este entorno industrial`);
    }
    return product;
  }

  // // 4. ACTUALIZAR: Fusión de datos (incluye metadata JSONB)
  // async update(id: number, updateProductDto: UpdateProductDto, businessId: string) {
  //   const product = await this.findOne(id, businessId);
  //
  //   // Object.assign se encarga de actualizar los campos básicos y el JSONB de metadata
  //   Object.assign(product, updateProductDto);
  //
  //   return await this.productRepository.save(product);
  // }
  //
  // // 5. ELIMINAR: Soft Delete para integridad de datos
  // async remove(id: number, businessId: string) {
  //   const product = await this.findOne(id, businessId);
  //
  //   product.isActive = false;
  //   await this.productRepository.save(product);
  //
  //   return { message: `Producto #${id} desactivado del motor universal` };
  // }
}