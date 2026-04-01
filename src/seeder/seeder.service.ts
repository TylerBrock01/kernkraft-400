import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { products as seedProducts } from './data/products';
import { seedTransactions } from './data/transactions';
import { Transaction, TransactionContent } from '../transactions/entities/transaction.entity';

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
      // 3. INYECCIÓN DE TRANSACCIONES (Historial de Ventas)
      console.log('--- [MCU_OS] Inyectando Historial de Transacciones... ---');

      for (const tData of seedTransactions) {
        // Creamos la cabecera de la venta
        const transaction = queryRunner.manager.create(Transaction, {
          businessId: tData.businessId,
          userId: tData.userId,
          total: tData.total,
          status: tData.status as any,
          transactionDate: tData.transactionDate
        });

        const savedTransaction = await queryRunner.manager.save(transaction);

        // Creamos los renglones (detalles) de la venta
        for (const item of tData.items) {

          // 🧠 BUSCADOR DINÁMICO: Obtenemos el ID real del producto
          const dbProduct = await queryRunner.manager.findOne(Product, {
            where: {
              id: item.productName,
              businessId: tData.businessId
            }
          });

          if (!dbProduct) {
            throw new Error(`[ABORTADO] El producto "${item.productName}" no se encontró en la base de datos.`);
          }

          const content = queryRunner.manager.create(TransactionContent, {
            transactionId: savedTransaction.id,
            productId: dbProduct.id, // 👈 ¡Inyectamos el ID real generado por Postgres!
            quantity: item.quantity,
            price: item.price
          });

          await queryRunner.manager.save(content);
        }
      }

      await queryRunner.commitTransaction();
      console.log('--- [MCU_OS] SISTEMA CARGADO: TRANSACCIONES DISPONIBLES ---');
      // await queryRunner.commitTransaction();
      console.log('--- [MCU_OS] INVENTARIO MULTI-TENANT CARGADO CON ÉXITO ---');

    } catch (error) {
      console.error('--- [MCU_OS] FALLO CRÍTICO EN CARGA ---', error.message);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}