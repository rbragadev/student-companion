'use client';

import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/(auth)/login/actions';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut size={18} className="shrink-0" />
        Sair
      </button>
    </form>
  );
}
