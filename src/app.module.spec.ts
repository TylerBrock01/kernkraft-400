import { AppModule } from './app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';

describe('AppModule', () => {
let appController: AppController;
let appService: AppService;
let categoriesModule: CategoriesModule;
let ProductModule: ProductsModule;

  beforeEach(async () => {
    const moduleref: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    appController = moduleref.get<AppController>(AppController);
    appService = moduleref.get(AppService);
    categoriesModule = moduleref.get(CategoriesModule);
    ProductModule = moduleref.get(ProductsModule);
  })
  it('should be defined', () => {
    expect(appController).toBeDefined();
    expect(appService).toBeDefined();
    expect(categoriesModule).toBeDefined();
    expect(ProductModule).toBeDefined();
  })
})