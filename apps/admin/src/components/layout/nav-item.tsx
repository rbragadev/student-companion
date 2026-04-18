'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  University,
  Building,
  CalendarDays,
  Network,
  GraduationCap,
  Building2,
  BookOpen,
  Home,
  MapPin,
  Users,
  UserCog,
  Shield,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NavIconName } from '@/config/navigation';

const ICONS: Record<NavIconName, React.ElementType> = {
  LayoutDashboard,
  University,
  Building,
  CalendarDays,
  Network,
  GraduationCap,
  Building2,
  BookOpen,
  Home,
  MapPin,
  Users,
  UserCog,
  Shield,
  KeyRound,
};

interface NavItemProps {
  href: string;
  label: string;
  icon: NavIconName;
}

export function NavItem({ href, label, icon }: Readonly<NavItemProps>) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon size={18} className="shrink-0" />
      {label}
    </Link>
  );
}
