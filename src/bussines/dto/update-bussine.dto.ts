import { PartialType } from '@nestjs/mapped-types';
import { CreateBussineDto } from './create-bussine.dto';

export class UpdateBussineDto extends PartialType(CreateBussineDto) {}
