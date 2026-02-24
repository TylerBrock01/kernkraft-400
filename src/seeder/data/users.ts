import { User } from '../../users/entities/user.entity';
import { Role } from '../../auth/roles/roles';

export const users: Partial<User>[] = [
  {
    email: "test@test.com",
    password: "vask81",
    role : Role.ADMIN
  },
  {
    email: "vendedor@vask81.com",
    password: "vask81",
    role: Role.VENDEDOR
  }
];