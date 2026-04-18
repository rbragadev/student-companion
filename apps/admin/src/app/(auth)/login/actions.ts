'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/permissions';
import type { Role } from '@/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface LoginState {
  error: string | null;
}

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Preencha e-mail e senha.' };
  }

  let token: string;
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
    // API retorna { statusCode, message, data: { token, user } }
    token = body.data.token;
    role = body.data.user.role as Role;
  } catch {
    return { error: 'Não foi possível conectar ao servidor.' };
  }

  if (!isAdminRole(role)) {
    return { error: 'Conta sem permissão de acesso ao painel administrativo.' };
  }

  (await cookies()).set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  });

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete('admin_token');
  redirect('/login');
}
