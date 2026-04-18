export type Role = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface Session {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: Role;
}
