import { validate } from 'class-validator';
import { UpdateProductDto } from './update-product.dto';

describe('UpdateProductDto', () => {
  it('product should has details', async () => {
    const dto = new UpdateProductDto();
    dto.id = 1;
    dto.price = 100;
    dto.stock = 10;
    dto.categoryId = 1;
    const errors = await validate(dto);
    console.log(errors);
    expect(errors.length).toBe(0);
  })
})