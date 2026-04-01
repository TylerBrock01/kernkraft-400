import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
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

  async getStorefront(slug: string) {
    // 1. BUSCAMOS EL NEGOCIO POR SU SLUG
    const business = await this.businessRepository.findOne({
      where: { slug: slug, isActive: true },
    });

    if (!business) {
      throw new NotFoundException(`La tienda '${slug}' no existe o se encuentra inactiva.`);
    }

    // 2. EXTRAEMOS EL INVENTARIO PÚBLICO
    const products = await this.productRepository.find({
      where: {
        businessId: business.id,
        // 🛡️ CTO Trick: Solo mostramos lo que realmente se puede vender/rentar.
        // Si el stock llega a 0, desaparece mágicamente del catálogo público.
        stock: MoreThan(0),
      },
      // 👁️ Solo exponemos los datos seguros (no mostramos IDs internos de proveedor, etc.)
      select: ['id', 'name', 'price', 'stock', 'slug'],
      order: { name: 'ASC' } // Ordenado alfabéticamente para que se vea pro
    });

    // 3. EMPAQUETAMOS LA VITRINA PARA EL FRONTEND
    return {
      store: {
        name: business.name,
        type: business.type,
        contact: business.config || {},
      },
      inventoryCount: products.length,
      catalog: products,
    };
  }
}