import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: Readonly<BreadcrumbsProps>) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-slate-700' : undefined}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={12} />}
          </span>
        );
      })}
    </nav>
  );
}
