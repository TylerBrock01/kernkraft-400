import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('bussines')
export class BusinessController {
  constructor(private readonly bussinesService: BusinessService) {}

  @Post()
  create(@Body() createBussineDto: CreateBusinessDto) {
    return this.bussinesService.create(createBussineDto);
  }

  @Get()
  findAll() {
    return this.bussinesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bussinesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBussineDto: UpdateBusinessDto) {
    return this.bussinesService.update(+id, updateBussineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bussinesService.remove(+id);
  }
}
