import { Role } from '../roles/roles';
import { SubscriptionPlan } from '../../business/entities/business.entity';

export class ActiveUser {
  id: number;
  email: string;
  role: Role;
  name: string;
  businessId: string;
  plan: SubscriptionPlan; // ¡Aquí TypeScript ya sabe que el plan existe!
}