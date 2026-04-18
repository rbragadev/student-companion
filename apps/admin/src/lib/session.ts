import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { Session } from '@/types/auth.types';

const COOKIE_NAME = 'admin_token';

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'student-companion-dev-secret',
  );
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');
  return session;
}
