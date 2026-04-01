import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { products as seedProducts } from './data/products';

@Injectable()
export class SeederService {
  constructor(private dataSource: DataSource) {}
// async onModuleInit(){
//   const connection =this.dataSource
//   await connection.dropDatabase();
//   await connection.synchronize();
//   console.log('from onModuleInit');
// }

  async seed() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('--- [MCU_OS] INICIANDO INYECCIÓN MULTI-TENANT ---');

      // 🚨 ADVERTENCIA: No hacemos dropDatabase() para proteger los negocios creados en Postman.

      // 2. INYECCIÓN DE PRODUCTOS
      console.log('--- [MCU_OS] Inyectando Productos... ---');
      for (const p of seedProducts) {

        if (!p.businessId || p.businessId.includes('PEGA_AQUI')) {
          throw new Error(`[ABORTADO] Falta configurar el UUID real para el producto: ${p.name}`);
        }

        // 🧠 ALGORITMO MCU: Generación automática de Slug
        const generatedSlug = p.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales (comillas, acentos raros)
          .replace(/[\s_-]+/g, '-') // Reemplaza espacios por guiones
          .replace(/^-+|-+$/g, ''); // Limpia guiones perdidos al inicio o final

        const product = queryRunner.manager.create(Product, {
          ...p,
          slug: generatedSlug, // 👈 INYECTAMOS EL SLUG AQUÍ
          isActive: true
        } as any);

        await queryRunner.manager.save(product);
        console.log(`[+] Producto inyectado: ${p.name} (Slug: ${generatedSlug})`);
      }

      await queryRunner.commitTransaction();
      console.log('--- [MCU_OS] INVENTARIO MULTI-TENANT CARGADO CON ÉXITO ---');

    } catch (error) {
      console.error('--- [MCU_OS] FALLO CRÍTICO EN CARGA ---', error.message);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}