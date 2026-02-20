import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseInterceptors,
  UploadedFile, HttpException, BadRequestException, UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductQueryDto } from './dto/get-product.dto';
import { IdValidationPipe } from '../common/pipes/id-validation/id-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageService } from '../upload-image/upload-image.service';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadImageService: UploadImageService,

  ) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    console.log(createProductDto);
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: GetProductQueryDto) {
    const category_id = query.category_id ? query.category_id : null;
    const deck_id = query.deck_id ? query.deck_id : null;
    const take = query.take ? query.take : 10;
    const skip = query.skip ? query.skip : 0;
    return this.productsService.findAll( category_id, deck_id, take,skip);
  }

  @Get(':id')
  findOne(@Param('id', IdValidationPipe) id: string) {
    return this.productsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', IdValidationPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', IdValidationPipe) id: string) {
    return this.productsService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }
    return this.uploadImageService.uploadFile(file)
  }
}
