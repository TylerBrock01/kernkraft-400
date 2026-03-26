import { Test, TestingModule } from '@nestjs/testing';
import { BussinesController } from './bussines.controller';
import { BussinesService } from './bussines.service';

describe('BussinesController', () => {
  let controller: BussinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BussinesController],
      providers: [BussinesService],
    }).compile();

    controller = module.get<BussinesController>(BussinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
