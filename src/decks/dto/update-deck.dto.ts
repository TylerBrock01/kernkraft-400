import { PartialType } from '@nestjs/mapped-types';
import { CreateDeckDto } from './create-deck.dto';

export class UpdateDeckDto extends PartialType(CreateDeckDto) {}
