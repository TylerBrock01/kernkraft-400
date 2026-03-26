import { Injectable } from '@nestjs/common';
import { CreateBussineDto } from './dto/create-bussine.dto';
import { UpdateBussineDto } from './dto/update-bussine.dto';

@Injectable()
export class BussinesService {
  create(createBussineDto: CreateBussineDto) {
    return 'This action adds a new bussine';
  }

  findAll() {
    return `This action returns all bussines`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bussine`;
  }

  update(id: number, updateBussineDto: UpdateBussineDto) {
    return `This action updates a #${id} bussine`;
  }

  remove(id: number) {
    return `This action removes a #${id} bussine`;
  }
}
