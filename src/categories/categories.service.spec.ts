import { CategoriesService } from './categories.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository;

  const mockCategoryRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ]

      mockCategoryRepository.find.mockResolvedValue(mockCategories)

      const result = await service.findAll()

      expect(categoryRepository.find).toHaveBeenCalledWith()
      expect(result).toEqual(mockCategories)
    })
  })

})