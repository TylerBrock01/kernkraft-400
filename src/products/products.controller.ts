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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetBusinessId } from '../auth/decorators/get-business-id.decorator';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';
import { RequirePlan } from '../auth/decorators/require-plan.decorator';
import { SubscriptionPlan } from '../business/entities/business.entity';
import { PlanGuard } from '../auth/guards/plan.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ActiveUser } from '../auth/classes/active-user.class'; // <--- Importante

@Controller('products')
@Roles(Role.ADMIN, Role.ALMACEN)
@UseGuards(JwtAuthGuard, RolesGuard, BusinessActiveGuard,PlanGuard)
@RequirePlan(SubscriptionPlan.LITE)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadImageService: UploadImageService,

  ) {}

  @Roles(Role.ADMIN, Role.ALMACEN)
  @Post()
  @UseInterceptors(FileInterceptor('file')) // 📸 Atrapa el archivo con la llave 'file'
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: ActiveUser,
    @UploadedFile() file?: Express.Multer.File // 📸 Lo recibimos como opcional
  ) {
    // Le pasamos el archivo al servicio
    return this.productsService.create(createProductDto, user, file);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ALMACEN)
  findAll(
    @Query() query: GetProductQueryDto,
    @GetUser() user: ActiveUser,
  ) {

    const take = query.take || 10;
    const skip = query.skip || 0;

    return this.productsService.findAll(user, take, skip);
  }

  @UseGuards(BusinessActiveGuard)
  @Get(':id')
  findOne(
    @Param('id', IdValidationPipe) id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.findOne(+id, businessId);
  }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @Patch(':id')
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.update(+id, updateProductDto, businessId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', IdValidationPipe) id: string,
    @GetBusinessId() businessId: string
  ) {
    return this.productsService.remove(+id, businessId);
  }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }
    return this.uploadImageService.uploadFile(file);
  }
}