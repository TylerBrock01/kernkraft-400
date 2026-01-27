import { CategoriesService } from './categories.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository;

  const mockCategoryRepository = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers:[
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        }
      ]
    }).compile()

    service = module.get<CategoriesService>(CategoriesService)
    categoryRepository = module.get(getRepositoryToken(Category))
  })
  it('should be defined', () => {
    expect(service).toBeDefined();
  })
  describe('create', () => {
    it('should create a category successfully', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category'
      }
      const savedCategory = { id: 1, ...createCategoryDto }

      mockCategoryRepository.save.mockResolvedValue(savedCategory)

      const result = await service.create(createCategoryDto)
      expect(categoryRepository.save).toHaveBeenCalledWith({ ...createCategoryDto })
      expect(result).toEqual(savedCategory)
    })
  })


})