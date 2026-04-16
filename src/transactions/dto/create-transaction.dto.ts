import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsDateString,
  Min
} from "class-validator";
// 🛡️ IMPORTANTE: Asegúrate de importar el Enum desde tu entidad
import { PaymentMethod, RentalStatus, TransactionStatus, TransactionType } from "../entities/transaction.entity";

export class TransactionContentsDto {
  @IsNotEmpty({ message: 'El ID del producto no puede estar vacío' })
  @IsInt({ message: 'Producto no válido' })
  productId: number;

  @IsNotEmpty({ message: 'La cantidad no puede estar vacía' })
  @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
  @Min(0, { message: 'La cantidad no puede ser negativa' }) // Opcional pero recomendado
  quantity: number;
}

export class CreateTransactionDto {

  // --- CAMPOS ORIGINALES ---
  @IsOptional()
  @IsString()
  coupon: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsArray()
  @ArrayNotEmpty({ message: 'Los contenidos no pueden ir vacíos' })
  @ValidateNested({ each: true })
  @Type(() => TransactionContentsDto)
  contents: TransactionContentsDto[];

  // 👤 CLIENTE (Opcional para ventas de mostrador, clave para rentas)
  @IsOptional()
  @IsInt({ message: 'El ID del cliente debe ser un número entero válido' })
  customerId?: number;

  @IsOptional()
  @IsEnum(TransactionType, {
    message: 'El tipo de transacción debe ser SALE (Venta) o RENTAL (Renta)'
  })
  type?: TransactionType;

  @IsOptional()
  @IsEnum(RentalStatus, {
    message: 'El estado de la renta debe ser UNFULFILLED (Pendiente), FULFILLED (Entregado) o RETURNED (Devuelto)'
  })
  rentalStatus?: RentalStatus;

  @IsOptional()
  @IsDateString({}, {
    message: 'La fecha de retorno debe ser una fecha ISO válida (ej. 2026-04-05T10:00:00Z)'
  })
  returnDate?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsNumber({}, { message: 'El monto del depósito debe ser un número' })
  @Min(0, { message: 'El depósito no puede ser negativo' })
  depositAmount?: number;
}