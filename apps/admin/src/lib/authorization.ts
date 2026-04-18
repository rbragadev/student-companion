import { redirect } from 'next/navigation';
import { getSession } from './session';
import { hasPermission } from './permissions';

export async function requirePermission(permission: string) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (!hasPermission(session.permissions, permission)) {
    redirect('/dashboard');
  }

  return session;
}

export async function assertActionPermission(permission: string) {
  const session = await getSession();
  if (!session || !hasPermission(session.permissions, permission)) {
    throw new Error('Ação não permitida para este usuário.');
  }
  return session;
}
