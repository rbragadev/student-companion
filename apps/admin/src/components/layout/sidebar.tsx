import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { navigation } from '@/config/navigation';
import { NavItem } from './nav-item';
import { LogoutButton } from './logout-button';

export async function Sidebar() {
  const session = await getSession();
  const role = session?.role ?? 'STUDENT';

  const visibleItems = navigation.filter(
    (item) => item.permission === null || hasPermission(role, item.permission),
  );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <GraduationCap size={18} className="text-white" />
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-white">
          Student Companion
          <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-xs font-normal text-slate-300">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <NavItem href={item.href} label={item.label} icon={item.icon} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 px-3 py-4">
        {session && (
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {session.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {session.email}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {session.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}
