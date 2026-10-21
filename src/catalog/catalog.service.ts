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
    limit: number = 12,
    search?: string,
  ) {
    // 1. Buscamos el negocio por su slug
    const business = await this.businessRepository.findOne({
      where: { slug },
    });

    if (!business) {
      throw new NotFoundException(`El establecimiento '${slug}' no existe.`);
    }

    // 2. Construimos la consulta para los productos del negocio
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.businessId = :businessId', { businessId: business.id })
      .andWhere('product.isActive = :isActive', { isActive: true });

    // 3. Filtro opcional por barra de búsqueda
    if (search && search.trim() !== '') {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${search.trim()}%`,
      });
    }

    // 4. Aplicamos paginación profesional (El 12 es perfecto para grids de 2, 3 y 4 columnas)
    const [products, total] = await query
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const lastPage = Math.ceil(total / limit) || 1;

    // 5. Retornamos la estructura exacta que tu frontend espera con metadatos completos
    return {
      store: {
        id: business.id,
        name: business.name,
        type: business.type,
        contact: business || {
          logoUrl: '',
          taxRate: 16,
          currency: 'MXN',
          primaryColor: '#3b82f6',
        },
      },
      catalog: {
        data: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          image: product.image,       // 📸 Thumbnail principal
          images: product.images,     // 🖼️ Array completo de la galería
          metadata: product.metadata, // 🧠 Atributos dinámicos (recámaras, tipo, etc.)
          type: product.type,
        })),
        meta: {
          total,
          page: Number(page),
          lastPage,
          hasSearch: !!search,
        },
      },
    };
  }

  // En catalog.service.ts
  async getProductDetail(businessSlug: string, productId: number) {
    // 1. Validar que el negocio exista
    const business = await this.businessRepository.findOne({
      where: { slug: businessSlug },
    });

    if (!business) {
      throw new NotFoundException(`El establecimiento '${businessSlug}' no existe.`);
    }

    // 2. Buscar el producto asegurando que pertenezca al negocio y esté activo
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        businessId: business.id,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('La propiedad o producto solicitado no se encuentra disponible.');
    }

    // 3. Retornar la estructura limpia lista para el frontend
    return {
      store: {
        id: business.id,
        name: business.name,
        type: business.type,
        contact: business || {
          logoUrl: '',
          taxRate: 16,
          currency: 'MXN',
          primaryColor: '#3b82f6',
        },
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        slug: product.slug,
        price: product.price,
        stock: product.stock,
        image: product.image,
        images: product.images,
        metadata: product.metadata,
        type: product.type,
      },
    };
  }
}