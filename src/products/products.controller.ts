// src/products/products.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductQueryDto } from './dto/get-product.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadImageService } from '../upload-image/upload-image.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles';
import { RolesGuard } from '../auth/guards/roles.guard';
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
  @UseInterceptors(FilesInterceptor('files', 5)) // 📸 Atrapa hasta 5 archivos bajo la llave 'files'
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: ActiveUser,
    @UploadedFiles() files?: Express.Multer.File[] // 📸 Los recibimos como arreglo opcional
  ) {
    // Le pasamos el arreglo de archivos al servicio
    return this.productsService.create(createProductDto, user, files);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ALMACEN)
  findAll(
    @Query() query: GetProductQueryDto,
    @GetUser() user: ActiveUser,
  ) {

    const take = query.take || 10;
    const skip = query.skip || 0;
    const search = query.search || ''; // Si no buscan nada, va vacío

    return this.productsService.findAll(user, take, skip,search);
  }

  @UseGuards(BusinessActiveGuard)
  @Get(':id')
  findOne(
    @Param('id', IdValidationPipe) id: string,
    @GetUser() user: ActiveUser,
  ) {
    return this.productsService.findOne(+id, user);
  }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file')) // 🛡️ Permite recibir FormData
  update(
    @Param('id', IdValidationPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: ActiveUser,
    @UploadedFile() file?: Express.Multer.File // 📸 Opcional, por si mandan archivo físico
  ) {
    return this.productsService.update(+id, updateProductDto, user);
  }
  //
  // @Roles(Role.ADMIN)
  // @Delete(':id')
  // remove(
  //   @Param('id', IdValidationPipe) id: string,
  //   @GetBusinessId() businessId: string
  // ) {
  //   return this.productsService.remove(+id, businessId);
  // }

  @Roles(Role.ADMIN, Role.ALMACEN)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('files', 5)) // Recibe hasta 5 archivos bajo la llave 'files'
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Images are required');
    }

    // Subimos todas en paralelo a Cloudinary
    const uploadPromises = files.map(file => this.uploadImageService.uploadFile(file));
    const results = await Promise.all(uploadPromises);

    // Regresamos un arreglo con las URLs seguras
    return results.map(res => res.secure_url);
  }
}