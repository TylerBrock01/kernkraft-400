import { validate } from 'class-validator';
import { UpdateCategoryDto } from './update-category.dto';

describe('UpdateCategoryDto', () => {
  it('category should has name', async () => {
    const dto = new UpdateCategoryDto();
    dto.id = 1;
    dto.name = 'blusa';
    const errors = await validate(dto);
    console.log(errors);
    expect(errors.length).toBe(0);
  })
})