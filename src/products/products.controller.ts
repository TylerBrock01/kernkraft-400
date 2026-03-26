// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductQueryDto } from './dto/get-product.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageService } from '../upload-image/upload-image.service';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetBusinessId } from '../auth/decorators/get-business-id.decorator'; // <--- Importante

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadImageService: UploadImageService,
  ) {}

  @Roles(Role.ADMIN, Role.ALMACEN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @GetBusinessId() businessId: string // <--- Inyectamos el candado de negocio
  ) {
    return this.productsService.create(createProductDto, businessId);
  }

  @UseGuards(JwtAuthGuard) // Protegemos el acceso para identificar el negocio
  @Get()
  findAll(
    @Query() query: GetProductQueryDto,
    @GetBusinessId() businessId: string // <--- Filtro automático por inquilino
  ) {
    const take = query.take ? query.take : 10;
    const skip = query.skip ? query.skip : 0;

    // El motor industrial ya no depende de categorías/decks fijos
    return this.productsService.findAll(businessId, take, skip);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', IdValidationPipe) id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.findOne(+id, businessId);
  }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.update(+id, updateProductDto, businessId);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(
    @Param('id', IdValidationPipe) id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.remove(+id, businessId);
  }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }
    return this.uploadImageService.uploadFile(file);
  }
}