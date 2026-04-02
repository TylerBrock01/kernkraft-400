import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString() // Validamos como string por si mandan solo coordenadas o el link
  addressLink?: string;

  @IsOptional()
  @IsBoolean()
  hasRetainedId?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}