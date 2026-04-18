import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { Session } from '@/types/auth.types';

export const TOKEN_COOKIE = 'admin_token';
export const PERMISSIONS_COOKIE = 'admin_permissions';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'student-companion-dev-secret',
  );
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const raw = jar.get(PERMISSIONS_COOKIE)?.value;
    const permissions: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return { ...(payload as object), permissions } as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');
  return session;
}

export { COOKIE_MAX_AGE };
