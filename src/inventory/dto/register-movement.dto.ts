import { MovementType } from '../entities/stock-movement.entity';

export interface RegisterMovementInput {
  businessId: string;
  materialId: number;
  type: MovementType;
  quantity: number;       // SIEMPRE positivo; el signo lo decide `direction`
  direction: 'in' | 'out';
  unitCost?: number;      // obligatorio en entradas de compra
  refType?: string;
  refId?: number;
  note?: string;
  createdBy?: string;
}