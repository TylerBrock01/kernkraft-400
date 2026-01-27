import 'reflect-metadata';
import { CreateTransactionDto, TransactionContentsDto } from './create-transaction.dto';
import { validate } from 'class-validator';

describe('CreateTransactionDto', () => {
  it('should create transaction content', async () => {
    const dtoCon: TransactionContentsDto = new TransactionContentsDto()
    dtoCon.productId = 1;
    dtoCon.quantity = 1;
    const errors = await validate(dtoCon);
    expect(errors.length).toBe(0);
  });
  it('should create transaction (no coupon) with transaction content', async () => {
    const dtoCon: TransactionContentsDto = new TransactionContentsDto()
    dtoCon.productId = 1;
    dtoCon.quantity = 1;
    const dto = new CreateTransactionDto();
    dto.contents = [dtoCon]
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  })
  it('should create transaction with coupon & transaction content', async () => {
    const dtoCon: TransactionContentsDto = new TransactionContentsDto()
    dtoCon.productId = 1;
    dtoCon.quantity = 1;
    const dto = new CreateTransactionDto();
    dto.coupon = '20'
    dto.contents = [dtoCon]
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
})