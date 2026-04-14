import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {join} from 'path'

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),//_URL para prod
  // host: configService.get<string>('DATABASE_HOST'),//_host local para prod
  // port: configService.get<number>('DATABASE_PORT'),
  // username: configService.get<string>('DATABASE_USER'),
  // password: configService.get<string>('DATABASE_PASS'),
  // database: configService.get<string>('DATABASE_NAME'),
  ssl: true,//true para produ
  logging: false,
  entities: [join(__dirname, '../**/*.entity.{js,ts}')],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
});
