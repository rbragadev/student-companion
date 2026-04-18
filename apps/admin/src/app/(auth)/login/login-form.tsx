'use client';

import { useActionState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginAction } from './actions';

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Student Companion</h1>
            <p className="text-sm text-slate-500">Painel Administrativo</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form action={action} className="flex flex-col gap-5">
            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="admin@studentcompanion.dev"
              autoComplete="email"
              required
            />
            <Input
              name="password"
              type="password"
              label="Senha"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <Button type="submit" isLoading={isPending} className="w-full">
              Entrar
            </Button>
          </form>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Dev: admin@studentcompanion.dev · senha123
          </p>
        )}
      </div>
    </div>
  );
}
