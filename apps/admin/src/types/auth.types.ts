export type Role = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface Session {
  sub: string;
  email: string;
  role: Role;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: Role;
  adminProfiles: {
    profile: { id: string; name: string; label: string };
  }[];
}

export interface AdminProfile {
  id: string;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { permissions: number; users: number };
  permissions?: { permission: Permission }[];
  users?: { user: Pick<AdminUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> }[];
}

export interface Permission {
  id: string;
  key: string;
  description: string;
  createdAt: string;
}
