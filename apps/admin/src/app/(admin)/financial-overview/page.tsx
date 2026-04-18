import { redirect } from 'next/navigation';

export default function LegacyFinancialOverviewRedirect() {
  redirect('/finance');
}
