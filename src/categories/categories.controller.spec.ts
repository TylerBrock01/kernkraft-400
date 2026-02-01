import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: any;

  // Mock del repositorio de TypeORM
  const mockRepository = {
    find: jest.fn().mockResolvedValue([{ id: 1, name: 'Electro' }]),
    save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 1, ...dto })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          // ESTA ES LA CLAVE: Usar el token correcto para el repositorio
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category in DB', async () => {
    const dto = { name: 'Pantalones' };
    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalledWith(dto);
    expect(result.name).toEqual(dto.name);
  });
});
