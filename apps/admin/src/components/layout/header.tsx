import { Bell } from 'lucide-react';
import { getSession } from '@/lib/session';

interface HeaderProps {
  title: string;
  description?: string;
}

export async function Header({ title, description }: HeaderProps) {
  const session = await getSession();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={16} />
        </button>

        {session && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {session.email[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
