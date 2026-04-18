import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { navigationGroups, type NavDependency } from '@/config/navigation';
import { apiFetch } from '@/lib/api';
import { NavItem } from './nav-item';
import { LogoutButton } from './logout-button';

export async function Sidebar() {
  const session = await getSession();
  const permissions = session?.permissions ?? [];

  const [institutions, schools, units, courses, classes, periods] = await Promise.all([
    apiFetch<unknown[]>('/institution').then((items) => items.length).catch(() => 0),
    apiFetch<unknown[]>('/school').then((items) => items.length).catch(() => 0),
    apiFetch<unknown[]>('/unit').then((items) => items.length).catch(() => 0),
    apiFetch<unknown[]>('/course').then((items) => items.length).catch(() => 0),
    apiFetch<unknown[]>('/class-group').then((items) => items.length).catch(() => 0),
    apiFetch<unknown[]>('/academic-period').then((items) => items.length).catch(() => 0),
  ]);

  const dependencyCount: Record<NavDependency, number> = {
    institutions,
    schools,
    units,
    courses,
    classes,
    periods,
  };

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const hasAccess = item.permission === null || hasPermission(permissions, item.permission);
        if (!hasAccess) return false;
        if (!item.dependsOn || item.dependsOn.length === 0) return true;
        return item.dependsOn.every((dep) => dependencyCount[dep] > 0);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <GraduationCap size={18} className="text-white" />
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-white">
          {'Student Companion '}
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-normal text-slate-300">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-4">
          {visibleGroups.map((group) => (
            <section key={group.title}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavItem href={item.href} label={item.label} icon={item.icon} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
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
