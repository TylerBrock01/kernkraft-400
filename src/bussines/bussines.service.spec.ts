import { Test, TestingModule } from '@nestjs/testing';
import { BussinesService } from './bussines.service';

describe('BussinesService', () => {
  let service: BussinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BussinesService],
    }).compile();

    service = module.get<BussinesService>(BussinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
