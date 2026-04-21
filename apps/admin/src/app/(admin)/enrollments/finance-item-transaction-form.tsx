'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type CreateAction = (formData: FormData) => void;

type Props = {
  enrollmentId: string;
  financeItemId: string;
  totalAmount: number;
  remainingAmount: number;
  emittedAmount: number;
  currency: string;
  action: CreateAction;
};

function parseMoneyInput(value: string): number {
  if (!value.trim()) return 0;
  const sanitized = value.trim().replace(/[^\d.,-]/g, '');
  if (!sanitized) return 0;

  const lastComma = sanitized.lastIndexOf(',');
  const lastDot = sanitized.lastIndexOf('.');
  const lastSeparator = Math.max(lastComma, lastDot);

  if (lastSeparator === -1) {
    const parsed = Number(sanitized.replace(/,/g, '').replace(/\./g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const rawIntegerPart = sanitized.slice(0, lastSeparator);
  const rawFractionPart = sanitized.slice(lastSeparator + 1);
  const integerPart = rawIntegerPart.replace(/[.,]/g, '');
  const fractionDigits = rawFractionPart.replace(/\D/g, '');

  let normalized = '';
  if (fractionDigits.length === 2) {
    normalized = `${integerPart}.${fractionDigits}`;
  } else {
    normalized = integerPart + fractionDigits;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatMoney(value: number, currency: string) {
  return `${Number(value).toFixed(2)} ${currency}`;
}

export default function FinanceItemTransactionForm({
  enrollmentId,
  financeItemId,
  remainingAmount,
  totalAmount,
  emittedAmount,
  currency,
  action,
}: Props) {
  const emittedAmountSafe = useMemo(() => Math.max(0, emittedAmount), [emittedAmount]);
  const totalAmountSafe = useMemo(() => Math.max(0, totalAmount), [totalAmount]);
  const totalToEmit = useMemo(
    () => Number((totalAmountSafe - emittedAmountSafe).toFixed(2)),
    [totalAmountSafe, emittedAmountSafe],
  );

  const [installmentInput, setInstallmentInput] = useState<string>(
    Number(Math.min(totalToEmit, 1000)).toFixed(2),
  );
  const [installmentsInput, setInstallmentsInput] = useState('1');
  const [dueDateOffsetInput, setDueDateOffsetInput] = useState('0');

  const installmentAmount = useMemo(() => parseMoneyInput(installmentInput), [installmentInput]);
  const installments = useMemo(() => {
    const parsed = Number(installmentsInput);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }, [installmentsInput]);

  const totalToCreate = useMemo(
    () => Number((installmentAmount * installments).toFixed(2)),
    [installmentAmount, installments],
  );
  const remainingAfter = useMemo(
    () => Math.max(0, Number((totalToEmit - totalToCreate).toFixed(2))),
    [totalToEmit, totalToCreate],
  );
  const missingAmount = useMemo(
    () => Math.max(0, Number((totalToCreate - totalToEmit).toFixed(2))),
    [totalToCreate, totalToEmit],
  );

  const canCreate =
    installments > 0 &&
    installmentAmount > 0 &&
    totalToCreate > 0 &&
    totalToCreate <= totalToEmit + 0.0001;

  return (
    <form action={action} className="mt-3 border border-dashed border-slate-200 p-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="financeItemId" value={financeItemId} />
      <input type="hidden" name="installmentAmount" value={installmentAmount.toFixed(2)} />
      <input type="hidden" name="installments" value={installments.toString()} />
      <input type="hidden" name="dueDateOffsetDays" value={dueDateOffsetInput || '0'} />

      <div className="mb-2 grid gap-1 text-xs text-slate-700">
        <p>
          Total da emissão: <strong>{formatMoney(totalToCreate, currency)}</strong>
        </p>
        <p>
          Emitido: <strong>{formatMoney(emittedAmountSafe, currency)}</strong>
        </p>
        <p>
          Falta emitir: <strong>{formatMoney(totalToEmit, currency)}</strong>
        </p>
        <p>
          Restante a receber: <strong>{formatMoney(remainingAmount, currency)}</strong>
        </p>
        <p>
          Falta emitir ap\xF3s esta emiss\xE3o:{' '}
          <strong>{formatMoney(remainingAfter, currency)}</strong>
        </p>
        {!canCreate && missingAmount > 0 && (
          <p className="text-rose-700">
            Excede o restante em {formatMoney(missingAmount, currency)}.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-medium text-slate-600">
          Valor da parcela
          <input
            inputMode="decimal"
            name="installmentAmountRaw"
            type="text"
            value={installmentInput}
            onChange={(event) => setInstallmentInput(event.currentTarget.value)}
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
            placeholder="Ex.: 1000.00"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Quantidade
          <input
            name="installmentsRaw"
            type="number"
            min="1"
            step="1"
            value={installmentsInput}
            onChange={(event) => setInstallmentsInput(event.currentTarget.value)}
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Vencimento em (dias)
          <input
            name="dueDateOffsetDaysRaw"
            type="number"
            min="0"
            step="1"
            value={dueDateOffsetInput}
            onChange={(event) => setDueDateOffsetInput(event.currentTarget.value)}
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-2 text-xs"
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-500">Soma das parcelas deve ser menor ou igual ao valor faltante a emitir.</p>
      <div className="mt-2">
        <Button type="submit" size="sm" variant="outline" disabled={!canCreate}>
          Criar transa\xE7\xF5es (item)
        </Button>
      </div>
    </form>
  );
}
