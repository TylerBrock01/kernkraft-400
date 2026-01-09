import { CreateCategoryDto } from './create-category.dto';
import { validate } from 'class-validator';

describe('CreateCategoryDto', () => {
  it('category should has name', async () => {
    const dto = new CreateCategoryDto();
    dto.name = 'blusa';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  })
})