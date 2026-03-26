import { Module } from '@nestjs/common';
import { BussinesService } from './bussines.service';
import { BussinesController } from './bussines.controller';

@Module({
  controllers: [BussinesController],
  providers: [BussinesService],
})
export class BussinesModule {}
