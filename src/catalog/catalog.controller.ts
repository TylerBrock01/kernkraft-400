import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';

@Controller('catalog')
@UseGuards(BusinessActiveGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug')
  async getCatalog(@Param('slug') slug: string) {
    return this.catalogService.getStorefront(slug);
  }
}