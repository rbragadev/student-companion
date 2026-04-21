import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';
import { enrollmentApi } from '../services/api/enrollmentApi';
import { useAuth } from '../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof StackRoutes.ENROLLMENT_CHECKOUT
>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.ENROLLMENT_CHECKOUT>;

function toMoneyNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function money(value: unknown, currency: string) {
  return `${toMoneyNumber(value).toFixed(2)} ${currency}`;
}

function packageTypeLabel(type?: string) {
  if (type === 'course_only') return 'Curso';
  if (type === 'course_with_accommodation') return 'Curso + Acomodação';
  if (type === 'accommodation_only') return 'Acomodação';
  return '-';
}

export default function EnrollmentCheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { enrollmentId } = route.params;
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const checkoutQuery = useQuery({
    queryKey: ['enrollment', 'checkout', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentCheckout(enrollmentId),
    enabled: !!enrollmentId,
    refetchOnMount: true,
  });

  const payMutation = useMutation({
    mutationFn: async () => enrollmentApi.payEnrollmentDownPaymentFake(enrollmentId),
    onSuccess: async (result) => {
      const isEntryPayment = result.payment?.type === 'down_payment';
      setFeedback(
        isEntryPayment
          ? 'Pagamento da entrada confirmado.'
          : 'Pagamento das parcelas emitidas confirmado.',
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'checkout', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'detail', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'timeline', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'package-summary', enrollmentId] }),
        userId
          ? queryClient.invalidateQueries({ queryKey: ['user', userId] })
          : Promise.resolve(),
      ]);
    },
  });

  const checkout = checkoutQuery.data;
  const canPayNow = Boolean(
    checkout && (checkout.state === 'available' || checkout.canPayPendingInstallments),
  );
  const hasPendingInstallments = Boolean(
    checkout?.financeOperations && checkout.financeOperations.pendingTransactionsCount > 0,
  );
  const payButtonLabel = checkout?.state === 'available'
    ? 'Pagar entrada (30%)'
    : 'Pagar parcelas emitidas';

  return (
    <Screen safeArea={true} scrollable={true}>
      <View className="px-4 py-4 gap-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={22} color={colorValues.textPrimary} />
          <Text variant="body" className="font-medium">Voltar</Text>
        </TouchableOpacity>

        <View>
          <Text variant="h2" className="font-semibold">Checkout do pacote</Text>
          <Text variant="bodySecondary" className="mt-1">
            {checkout?.state === 'available'
              ? 'MVP: cobramos somente a entrada (30%). O restante fica pendente para cobrança operacional.'
              : 'Acompanhe entrada, parcelas emitidas e pagamentos pendentes do pacote.'}
          </Text>
        </View>

        {feedback && (
          <Card className="border-green-200 bg-green-50">
            <Text variant="caption" className="text-green-700">{feedback}</Text>
          </Card>
        )}

        {checkoutQuery.isLoading && <Text variant="body">Carregando checkout...</Text>}

        {checkoutQuery.isError && (
          <Card className="border-red-200 bg-red-50">
            <Text variant="body" className="text-red-700">Não foi possível carregar o checkout.</Text>
            <Button className="mt-3" onPress={() => checkoutQuery.refetch()}>
              Tentar novamente
            </Button>
          </Card>
        )}

        {checkout && (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">Pacote / Carrinho</Text>
              <View className="mt-3 gap-1">
                <Text variant="caption">Tipo: {packageTypeLabel(checkout.quote?.type)}</Text>
                <Text variant="caption">Status do pacote: {checkout.packageStatus ?? checkout.state}</Text>
                {checkout.reason ? <Text variant="caption">{checkout.reason}</Text> : null}
                {checkout.nextStep ? <Text variant="caption">Próximo passo: {checkout.nextStep}</Text> : null}
                <Text variant="caption">
                  Curso: {checkout.course?.program_name ?? '-'}
                </Text>
                <Text variant="caption">
                  Turma: {checkout.classGroup ? `${checkout.classGroup.name} (${checkout.classGroup.code})` : '-'}
                </Text>
                <Text variant="caption">Período acadêmico: {checkout.academicPeriod?.name ?? '-'}</Text>
                {checkout.accommodation ? (
                  <Text variant="caption">Acomodação: {checkout.accommodation.title}</Text>
                ) : (
                  <Text variant="caption">Acomodação: sem acomodação</Text>
                )}
                {(checkout.quote?.items ?? []).map((item) => (
                  <Text key={item.id} variant="caption">
                    Item {item.itemType}: {new Date(item.startDate).toLocaleDateString()} -{' '}
                    {new Date(item.endDate).toLocaleDateString()} •{' '}
                    {money(item.amount, checkout.financial.currency)}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Financeiro</Text>
              <View className="mt-3 gap-1">
                {checkout.quote ? (
                  <>
                    <Text variant="caption">
                      Curso: {money(checkout.quote.courseAmount, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption">
                      Acomodação: {money(checkout.quote.accommodationAmount, checkout.financial.currency)}
                    </Text>
                  </>
                ) : null}
                <Text variant="caption">
                  Total: {money(checkout.financial.totalAmount, checkout.financial.currency)}
                </Text>
                <Text variant="caption">
                  Entrada (30%): {money(checkout.financial.downPaymentAmount, checkout.financial.currency)}
                </Text>
                <Text variant="caption">
                  Saldo: {money(checkout.financial.remainingAmount, checkout.financial.currency)}
                </Text>
                {checkout.financeOperations ? (
                  <>
                    <Text variant="caption" className="mt-2 font-medium text-textPrimary">
                      Operação financeira da jornada
                    </Text>
                    <Text variant="caption">
                      Emitido: {money(checkout.financeOperations.emittedAmount, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption">
                      Pago: {money(checkout.financeOperations.paidAmount, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption">
                      Em aberto: {money(checkout.financeOperations.pendingAmount, checkout.financial.currency)} ({checkout.financeOperations.pendingTransactionsCount} cobrança{checkout.financeOperations.pendingTransactionsCount === 1 ? '' : 's'})
                    </Text>
                  </>
                ) : null}
                {checkout.financialBreakdown ? (
                  <>
                    <Text variant="caption" className="mt-2 font-medium text-textPrimary">
                      Rateio interno da entrada (1 cobrança)
                    </Text>
                    <Text variant="caption">
                      Entrada Curso: {money(checkout.financialBreakdown.downPayment.course, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption">
                      Entrada Acomodação: {money(checkout.financialBreakdown.downPayment.accommodation, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption" className="mt-2 font-medium text-textPrimary">
                      Saldos pendentes por item
                    </Text>
                    <Text variant="caption">
                      Saldo Curso: {money(checkout.financialBreakdown.remaining.course, checkout.financial.currency)}
                    </Text>
                    <Text variant="caption">
                      Saldo Acomodação: {money(checkout.financialBreakdown.remaining.accommodation, checkout.financial.currency)}
                    </Text>
                  </>
                ) : null}
              </View>
            </Card>

            {hasPendingInstallments && checkout.financeOperations ? (
              <Card>
                <Text variant="h3" className="font-semibold">Cobranças emitidas</Text>
                <View className="mt-3 gap-2">
                  {checkout.financeOperations.pendingTransactions.map((transaction) => (
                    <View key={transaction.id} className="rounded-lg border border-border p-3">
                      <Text variant="caption" className="font-medium text-textPrimary">
                        {transaction.financeItemTitle}
                      </Text>
                      <Text variant="caption">
                        {transaction.itemType} • {money(transaction.amount, transaction.currency)}
                      </Text>
                      {transaction.dueDate ? (
                        <Text variant="caption">
                          Vencimento: {new Date(transaction.dueDate).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {canPayNow && (
              <Button onPress={() => payMutation.mutate()} disabled={payMutation.isPending}>
                {payMutation.isPending ? 'Processando pagamento...' : payButtonLabel}
              </Button>
            )}

            {checkout.state === 'paid' && !checkout.canPayPendingInstallments && (
              <Card className="border-green-200 bg-green-50">
                <Text variant="caption" className="text-green-700">
                  Entrada já confirmada para este pacote.
                </Text>
              </Card>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
