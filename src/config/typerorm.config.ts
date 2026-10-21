import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {join} from 'path'

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST'),//_host local para prod
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USER'),
  password: configService.get<string>('DATABASE_PASS'),
  database: configService.get<string>('DATABASE_NAME'),
  ssl: false,//true para produ
  // logging: false,
  entities: [join(__dirname, '../**/*.entity.{js,ts}')],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
});

// export const typeOrmConfig = (
//   configService: ConfigService,
// ): TypeOrmModuleOptions => {
//   const isProduction = configService.get<string>('NODE_ENV') === 'production';
//
//   return {
//     type: 'postgres',
//     // Usamos el URL completo que nos regala Railway
//     url: configService.get<string>('DATABASE_URL'),
//
//     // 🛡️ FIX SSL: Vital para que Railway no rechace la conexión interna
//     ssl: isProduction ? { rejectUnauthorized: false } : false,
//
//     // Si tienes problemas de que no detecta tus tablas al subir a producción,
//     // borra la línea de entities y usa autoLoadEntities: true directamente en tu app.module.ts
//     entities: [__dirname + '/../**/*.entity.{js,ts}'],
//
//     // 🛡️ EL ESCUDO: Protege los datos en producción
//     synchronize: !isProduction,
//
//     // Opcional: Útil para ver en la consola de Railway si las consultas están lentas
//     logging: !isProduction,
//   };
// };
