import { ProductsService } from './products.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository;
  let categoryRepository;

  const mockProductRepository = {
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockCategoryRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        stock: 10,
        categoryId: 1,
      };

      const mockCategory = { id: 1, name: 'Test Category' };
      const savedProduct = { id: 1, ...createProductDto, category: mockCategory };

      mockCategoryRepository.findOneBy.mockResolvedValue(mockCategory);
      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.create(createProductDto);

      expect(categoryRepository.findOneBy).toHaveBeenCalledWith({ id: createProductDto.categoryId });
      expect(productRepository.save).toHaveBeenCalledWith({ ...createProductDto, category: mockCategory });
      expect(result).toEqual(savedProduct);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        stock: 10,
        categoryId: 999,
      };

      mockCategoryRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of products and total count', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];
      const total = 2;

      mockProductRepository.findAndCount.mockResolvedValue([mockProducts, total]);

      const result = await service.findAll();

      expect(productRepository.findAndCount).toHaveBeenCalledWith({
        loadEagerRelations: true,
        order: { id: 'DESC' },
        take: undefined,
        skip: undefined,
      });
      expect(result).toEqual({ products: mockProducts, total });
    });

    it('should apply filters correctly', async () => {
        const categoryId = 1;
        const take = 10;
        const skip = 0;
        const mockProducts = [{ id: 1, name: 'Product 1' }];
        const total = 1;

        mockProductRepository.findAndCount.mockResolvedValue([mockProducts, total]);

        await service.findAll(categoryId, take, skip);

        expect(productRepository.findAndCount).toHaveBeenCalledWith({
            loadEagerRelations: true,
            order: { id: 'DESC' },
            take,
            skip,
            where: { category: { id: categoryId } }
        });
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const mockProduct = { id: 1, name: 'Test Product' };
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { category: true },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      const mockProduct = { id: 1, name: 'Old Product' };
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updateProductDto);

      expect(productRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateProductDto));
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product to update not found', async () => {
        mockProductRepository.findOne.mockResolvedValue(null);
        await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new category in update does not exist', async () => {
        const updateProductDto: UpdateProductDto = { categoryId: 999 };
        const mockProduct = { id: 1, name: 'Old Product' };

        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockCategoryRepository.findOneBy.mockResolvedValue(null);

        await expect(service.update(1, updateProductDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product successfully', async () => {
      const mockProduct = { id: 1, name: 'Test Product' };
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.remove.mockResolvedValue(mockProduct);

      const result = await service.remove(1);

      expect(productRepository.remove).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual('Product #1 REMOVED');
    });

    it('should throw NotFoundException if product to remove not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});