import { apiClient } from './client';
import type { CheckoutPayment } from '../../types/enrollment.types';

export interface InvoiceSummary {
  id: string;
  number: string;
  enrollmentId?: string | null;
  enrollmentQuoteId?: string | null;
  totalAmount: number;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  createdAt: string;
}

export const financeApi = {
  createInvoiceByQuote: async (payload: {
    enrollmentQuoteId: string;
    dueDate?: string;
    status?: 'draft' | 'pending';
  }): Promise<InvoiceSummary> => {
    const { data } = await apiClient.post('/invoices', payload);
    return data as InvoiceSummary;
  },

  createFakePaymentByQuote: async (payload: {
    enrollmentQuoteId: string;
    invoiceId?: string;
    amount: number;
    currency: string;
    type?: 'down_payment' | 'balance';
  }): Promise<CheckoutPayment> => {
    const normalizedAmount = Number(payload.amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0.01) {
      throw new Error('Valor de pagamento inválido');
    }

    const { data } = await apiClient.post('/payments', {
      enrollmentQuoteId: payload.enrollmentQuoteId,
      invoiceId: payload.invoiceId,
      amount: Number(normalizedAmount.toFixed(2)),
      currency: payload.currency,
      type: payload.type ?? 'down_payment',
      status: 'paid',
      provider: 'fake',
    });
    return data as CheckoutPayment;
  },
};
