'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/permissions';
import { TOKEN_COOKIE, PERMISSIONS_COOKIE, COOKIE_MAX_AGE } from '@/lib/session';
import type { Role } from '@/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface LoginState {
  error: string | null;
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: COOKIE_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
};

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Preencha e-mail e senha.' };

  let token: string;
  let userId: string;
  let role: Role;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!res.ok) return { error: 'E-mail ou senha incorretos.' };

    const body = await res.json();
    token = body.data.token;
    userId = body.data.user.id;
    role = body.data.user.role as Role;
  } catch {
    return { error: 'Não foi possível conectar ao servidor.' };
  }

  if (!isAdminRole(role)) {
    return { error: 'Conta sem permissão de acesso ao painel administrativo.' };
  }

  // Busca permissões efetivas do usuário (union dos perfis atribuídos)
  let permissions: string[] = [];
  try {
    const permRes = await fetch(`${API_URL}/users/${userId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (permRes.ok) {
      const permBody = await permRes.json();
      permissions = Array.isArray(permBody.data) ? permBody.data : [];
    }
  } catch {
    // Permissões indisponíveis — sessão continua sem permissões finas
  }

  const jar = await cookies();
  jar.set(TOKEN_COOKIE, token, COOKIE_OPTS);
  jar.set(PERMISSIONS_COOKIE, JSON.stringify(permissions), {
    ...COOKIE_OPTS,
    httpOnly: false, // Lido pelo cliente se necessário
  });

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(PERMISSIONS_COOKIE);
  redirect('/login');
}
