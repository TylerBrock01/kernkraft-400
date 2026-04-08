import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, ILike } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Business } from '../business/entities/business.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getStorefront(
    slug: string,
    page: number = 1,
    limit: number = 12, // 12 es el número dorado para grids (múltiplo de 2, 3 y 4 columnas)
    search?: string
  ) {
    // 1. BUSCAMOS EL NEGOCIO POR SU SLUG (Tenant Identification)
    const business = await this.businessRepository.findOne({
      where: { slug: slug, isActive: true },
    });

    if (!business) {
      throw new NotFoundException(`La tienda '${slug}' no existe o se encuentra inactiva.`);
    }

    const skip = (page - 1) * limit;

    // 2. CONSTRUCCIÓN DINÁMICA DE LA CONSULTA
    const whereCondition: any = {
      businessId: business.id,
      // 🛡️ CTO Trick: Si el stock llega a 0, desaparece mágicamente.
      stock: MoreThan(0),
    };

    // 🔍 Inyección del Buscador
    if (search) {
      // Usamos ILike para ignorar mayúsculas/minúsculas (ej: "torta" encuentra "Torta")
      whereCondition.name = ILike(`%${search}%`);
    }

    // 3. EXTRACCIÓN DEL INVENTARIO PÚBLICO (Paginado)
    const [products, total] = await this.productRepository.findAndCount({
      where: whereCondition,
      select: ['id', 'name', 'price', 'stock', 'slug', 'description'], // Solo datos seguros
      order: { name: 'ASC' },
      take: limit,
      skip: skip,
    });

    // 4. EMPAQUETAMOS LA VITRINA PARA EL FRONTEND
    return {
      store: {
        name: business.name,
        type: business.type,
        contact: business.config || {},
      },
      catalog: {
        data: products,
        meta: {
          total,
          page: Number(page),
          lastPage: Math.ceil(total / limit),
          hasSearch: !!search // Bandera útil para que el Frontend sepa si está viendo resultados de búsqueda
        }
      }
    };
  }
}