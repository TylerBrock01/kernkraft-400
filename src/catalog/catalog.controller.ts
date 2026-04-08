import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';

@Controller('catalog')
@UseGuards(BusinessActiveGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug')
  async getCatalog(
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('search') search?: string,
  ) {
    return this.catalogService.getStorefront(
      slug,
      page,
      limit,
      search
    );
  }
}