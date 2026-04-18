import { Building2, BookOpen, Home, MapPin, Users, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { getSession } from '@/lib/session';
import { apiFetch } from '@/lib/api';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

async function fetchCount(path: string): Promise<number> {
  try {
    const data = await apiFetch<unknown[]>(path);
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const session = await getSession();

  const [schools, courses, accommodations, places] = await Promise.all([
    fetchCount('/school'),
    fetchCount('/course'),
    fetchCount('/accommodation'),
    fetchCount('/place'),
  ]);

  const firstName = session?.email.split('@')[0] ?? 'Admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Visão geral da plataforma Student Companion"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Escolas"
          value={schools}
          icon={<Building2 size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Cursos"
          value={courses}
          icon={<BookOpen size={20} className="text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          label="Acomodações"
          value={accommodations}
          icon={<Home size={20} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Lugares"
          value={places}
          icon={<MapPin size={20} className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      {/* Módulos em breve */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Próximos módulos</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Gestão de Alunos', icon: Users },
            { label: 'Instituições', icon: Building2 },
            { label: 'Unidades', icon: MapPin },
            { label: 'Turmas', icon: BookOpen },
            { label: 'Matrículas', icon: Home },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 p-4 text-center"
            >
              <Icon size={20} className="text-slate-300" />
              <span className="text-xs text-slate-400">{label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                Em breve
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
