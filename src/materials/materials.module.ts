import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { UnitsModule } from '../units/units.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [TypeOrmModule.forFeature([Material]), UnitsModule, InventoryModule, BusinessModule],
  providers: [MaterialsService],
  controllers: [MaterialsController],
  exports: [MaterialsService],
})
export class MaterialsModule {}