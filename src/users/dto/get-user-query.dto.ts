// src/users/dto/get-user-query.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'; // Ajusta la ruta

export class GetUserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  search?: string;
}