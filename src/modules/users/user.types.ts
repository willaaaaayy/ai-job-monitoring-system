import { User } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

export interface CreateUserDto {
  email: string;
  password: string;
}
