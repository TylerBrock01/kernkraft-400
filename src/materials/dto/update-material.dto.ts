import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMaterialDto } from './create-material.dto';

export class UpdateMaterialDto extends PartialType(OmitType(CreateMaterialDto, ['baseUnitId'] as const)) {}