import { Button } from '@/components/ui/button';
import type { EnrollmentQuoteAdmin } from '@/types/catalog.types';
import { formatDateTimePtBr } from '@/lib/date';
import { createOrderFromQuoteAction } from './actions';

function formatMoney(value: number, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

interface Props {
  quotes: EnrollmentQuoteAdmin[];
  expectedOrderType: 'course' | 'accommodation' | 'package';
  operationTitle: string;
  operationDescription: string;
  submitLabel: string;
}

function quoteStudentLabel(quote: EnrollmentQuoteAdmin) {
  const student = quote.enrollment?.student;
  if (!student) return `Aluno: ${quote.userId ?? 'Sem aluno'}`;
  return `${student.firstName} ${student.lastName} • ${student.email}`;
}

function quotePeriodLabel(quote: EnrollmentQuoteAdmin) {
  const createdAt = formatDateTimePtBr(quote.createdAt);
  return `${createdAt} • ${quote.type}`;
}

function quoteCodeLabel(quote: EnrollmentQuoteAdmin) {
  return `${quote.id.slice(0, 8)}`;
}

function quoteItemsLabel(quote: EnrollmentQuoteAdmin) {
  const items = quote.items ?? [];
  const courses = items.filter((item) => item.itemType === 'course').length;
  const accommodacions = items.filter((item) => item.itemType === 'accommodation').length;
  return `${courses} curso(s), ${accommodacions} acomodação(ões)`;
}

export function NewOperationFromQuoteForm({
  quotes,
  expectedOrderType,
  operationTitle,
  operationDescription,
  submitLabel,
}: Readonly<Props>) {
  return (
    <form action={createOrderFromQuoteAction} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="expectedOrderType" value={expectedOrderType} />

      <div>
        <p className="text-sm font-semibold text-slate-900">{operationTitle}</p>
        <p className="text-xs text-slate-500">{operationDescription}</p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Selecionar cotação
        <select name="quoteId" required className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
          <option value="">{quotes.length ? 'Escolha uma cotação' : 'Sem cotação disponível'}</option>
          {quotes.map((quote) => {
            const studentLabel = quoteStudentLabel(quote);
            return (
              <option key={quote.id} value={quote.id}>
                {studentLabel} — {formatMoney(quote.totalAmount, quote.currency)} ({quotePeriodLabel(quote)}) • cotação {quoteCodeLabel(quote)} • {quoteItemsLabel(quote)}
              </option>
            );
          })}
        </select>
      </label>

      {quotes.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-800">Resumo da cotação</p>
          <p className="mt-1 text-slate-600">
            Os itens selecionados serão convertidos para operação e criados no status de rascunho.
          </p>
        </div>
      ) : null}

      <div>
        <Button type="submit" size="sm" disabled={!quotes.length}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
