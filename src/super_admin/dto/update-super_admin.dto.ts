import { PartialType } from '@nestjs/mapped-types';
import { CreateSuperAdminDto } from './create-super_admin.dto';

export class UpdateSuperAdminDto extends PartialType(CreateSuperAdminDto) {}
