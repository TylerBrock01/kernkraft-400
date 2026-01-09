import { CreateProductDto } from './create-product.dto';
import { validate } from 'class-validator';

describe('CreateProductDto', () => {
  it('product should has details', async () => {
    const dto = new CreateProductDto();
    dto.name = 'x';
    dto.price = 100;
    dto.stock = 10;
    dto.categoryId = 1;
    const errors = await validate(dto);
    console.log(errors);
    expect(errors.length).toBe(0);
  })
})