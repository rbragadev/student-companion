import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes, TabRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';
import { useAccommodationById } from '../hooks/api/useAccommodations';
import { enrollmentIntentApi } from '../services/api/enrollmentIntentApi';
import type { AccommodationPricing, EnrollmentQuote } from '../types/enrollment.types';
import { financeApi, type InvoiceSummary } from '../services/api/financeApi';
import { useAuth } from '../contexts/AuthContext';
import { setDraftQuoteId } from '../utils/draftQuoteStorage';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof StackRoutes.ACCOMMODATION_CHECKOUT
>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.ACCOMMODATION_CHECKOUT>;

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextSundayFromToday() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day;
  start.setUTCDate(start.getUTCDate() + diff);
  return start.toISOString().slice(0, 10);
}

function diffDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMoney(value: number | undefined, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

function toValidAmount(value: unknown, fallback?: number): number {
  const primary = Number(value);
  if (Number.isFinite(primary) && primary >= 0.01) return Number(primary.toFixed(2));
  const secondary = Number(fallback);
  if (Number.isFinite(secondary) && secondary >= 0.01) return Number(secondary.toFixed(2));
  return 0;
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export default function AccommodationCheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { accommodationId, initialStartDate, initialEndDate, mode } = route.params;
  const { userId } = useAuth();

  const { data: accommodation, isLoading } = useAccommodationById(accommodationId);

  const [pricingOptions, setPricingOptions] = React.useState<AccommodationPricing[]>([]);
  const [selectedPricing, setSelectedPricing] = React.useState<AccommodationPricing | null>(null);
  const [startDate, setStartDate] = React.useState(initialStartDate ?? nextSundayFromToday());
  const [weeks, setWeeks] = React.useState(4);
  const [resolvedPricing, setResolvedPricing] = React.useState<AccommodationPricing | null>(null);
  const [currentQuote, setCurrentQuote] = React.useState<EnrollmentQuote | null>(null);
  const [quote, setQuote] = React.useState<EnrollmentQuote | null>(null);
  const [quoteOrigin, setQuoteOrigin] = React.useState<'package' | 'standalone' | null>(null);
  const [invoice, setInvoice] = React.useState<InvoiceSummary | null>(null);
  const [payStatus, setPayStatus] = React.useState<'idle' | 'paid'>('idle');
  const [loadingCurrentQuote, setLoadingCurrentQuote] = React.useState(false);
  const [loadingPricing, setLoadingPricing] = React.useState(false);
  const [creatingQuote, setCreatingQuote] = React.useState(false);
  const [addingToPackage, setAddingToPackage] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const endDate = React.useMemo(() => addDays(startDate, weeks * 7), [startDate, weeks]);
  const durationDays = weeks * 7;

  const startDateOptions = React.useMemo(() => {
    const initial = nextSundayFromToday();
    return Array.from({ length: 10 }).map((_, idx) => addDays(initial, idx * 7));
  }, []);

  const currentCourseItem = React.useMemo(
    () => currentQuote?.items?.find((item) => item.itemType === 'course') ?? null,
    [currentQuote],
  );
  const isDirectCatalogFlow = !mode;
  const canAddToCurrentPackage = Boolean(
    currentQuote &&
      currentCourseItem &&
      currentQuote.type !== 'accommodation_only' &&
      currentQuote.packageStatus !== 'paid' &&
      currentQuote.packageStatus !== 'cancelled',
  );

  React.useEffect(() => {
    if (!userId) return;
    const quoteId = quote?.id ?? currentQuote?.id;
    if (!quoteId) return;
    void setDraftQuoteId(userId, quoteId);
  }, [quote?.id, currentQuote?.id, userId]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const options = await enrollmentIntentApi.getAccommodationPricingOptions(accommodationId);
        setPricingOptions(options);
        setSelectedPricing(options[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar pricing da acomodação');
      }
    };

    void run();
  }, [accommodationId]);

  React.useEffect(() => {
    const run = async () => {
      if (!userId) return;
      try {
        setLoadingCurrentQuote(true);
        const latest = await enrollmentIntentApi.getCurrentQuoteByStudent(userId);
        setCurrentQuote(latest);
      } catch {
        setCurrentQuote(null);
      } finally {
        setLoadingCurrentQuote(false);
      }
    };
    void run();
  }, [userId]);

  React.useEffect(() => {
    if (initialStartDate && initialEndDate) {
      const days = diffDays(initialStartDate, initialEndDate);
      if (days > 0 && days % 7 === 0) {
        setStartDate(initialStartDate);
        setWeeks(Math.max(1, days / 7));
      }
      return;
    }

    if (!currentCourseItem || mode === 'standalone') return;
    const start = currentCourseItem.startDate.slice(0, 10);
    const end = currentCourseItem.endDate.slice(0, 10);
    const days = diffDays(start, end);
    if (days > 0 && days % 7 === 0) {
      setStartDate(start);
      setWeeks(Math.max(1, days / 7));
    }
  }, [currentCourseItem, initialEndDate, initialStartDate, mode]);

  React.useEffect(() => {
    const run = async () => {
      if (!selectedPricing) {
        setResolvedPricing(null);
        return;
      }
      try {
        setLoadingPricing(true);
        setError(null);
        const pricing = await enrollmentIntentApi.getAccommodationPricing(
          accommodationId,
          selectedPricing.periodOption,
          {
            startDate: toIsoDate(startDate),
            endDate: toIsoDate(endDate),
          },
        );
        setResolvedPricing(pricing);
      } catch (err) {
        setResolvedPricing(null);
        setError(err instanceof Error ? err.message : 'Período inválido para cálculo de acomodação');
      } finally {
        setLoadingPricing(false);
      }
    };
    void run();
  }, [accommodationId, selectedPricing, startDate, endDate]);

  const createStandaloneQuote = async () => {
    if (!selectedPricing || !resolvedPricing) return;

    try {
      setCreatingQuote(true);
      setError(null);
      setFeedback(null);
      const created = await enrollmentIntentApi.createQuote({
        accommodationId,
        accommodationPricingId: selectedPricing.id,
        periodOption: selectedPricing.periodOption,
        downPaymentPercentage: 30,
        items: [
          {
            itemType: 'accommodation',
            referenceId: selectedPricing.id,
            accommodationPricingId: selectedPricing.id,
            startDate: toIsoDate(startDate),
            endDate: toIsoDate(endDate),
          },
        ],
      });
      setQuote(created);
      setQuoteOrigin('standalone');
      setFeedback('Acomodação fechada em pacote standalone.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao fechar pacote de acomodação');
    } finally {
      setCreatingQuote(false);
    }
  };

  const addToCurrentPackage = async () => {
    if (!selectedPricing || !canAddToCurrentPackage || !currentQuote) return;
    try {
      setAddingToPackage(true);
      setError(null);
      setFeedback(null);

      const preservedItems =
        currentQuote.items
          ?.filter((item) => item.itemType !== 'accommodation')
          .map((item) => ({
            itemType: item.itemType,
            referenceId: item.referenceId,
            startDate: item.startDate,
            endDate: item.endDate,
            ...(item.itemType === 'course'
              ? { coursePricingId: item.referenceId }
              : { accommodationPricingId: item.referenceId }),
          })) ?? [];

      let recalculated: EnrollmentQuote;
      try {
        recalculated = await enrollmentIntentApi.recalculateQuote(currentQuote.id, {
          items: [
            ...preservedItems,
            {
              itemType: 'accommodation',
              referenceId: selectedPricing.id,
              accommodationPricingId: selectedPricing.id,
              startDate: toIsoDate(startDate),
              endDate: toIsoDate(endDate),
            },
          ],
          fees: Number(currentQuote.fees ?? 0),
          discounts: Number(currentQuote.discounts ?? 0),
          downPaymentPercentage: Number(currentQuote.downPaymentPercentage ?? 30),
        });
      } catch {
        recalculated = await enrollmentIntentApi.createQuote({
          downPaymentPercentage: Number(currentQuote.downPaymentPercentage ?? 30),
          fees: Number(currentQuote.fees ?? 0),
          discounts: Number(currentQuote.discounts ?? 0),
          items: [
            ...preservedItems,
            {
              itemType: 'accommodation',
              referenceId: selectedPricing.id,
              accommodationPricingId: selectedPricing.id,
              startDate: toIsoDate(startDate),
              endDate: toIsoDate(endDate),
            },
          ],
        });
      }

      setQuote(recalculated);
      setCurrentQuote(recalculated);
      setQuoteOrigin('package');
      setFeedback('Acomodação adicionada ao pacote atual com recálculo de preço.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar acomodação ao pacote');
    } finally {
      setAddingToPackage(false);
    }
  };

  const payDownPaymentFake = async () => {
    if (!quote || quoteOrigin !== 'standalone') return;

    try {
      setPaying(true);
      setError(null);

      let currentInvoice = invoice;
      if (!currentInvoice) {
        currentInvoice = await financeApi.createInvoiceByQuote({
          enrollmentQuoteId: quote.id,
          status: 'pending',
        });
        setInvoice(currentInvoice);
      }

      const downPayment = toValidAmount(quote.downPaymentAmount, Number(quote.totalAmount) * 0.3);
      if (downPayment < 0.01) {
        throw new Error('Valor de entrada inválido para pagamento');
      }

      await financeApi.createFakePaymentByQuote({
        enrollmentQuoteId: quote.id,
        invoiceId: currentInvoice.id,
        amount: downPayment,
        currency: quote.currency,
      });
      setPayStatus('paid');
      setFeedback('Pagamento fake da entrada confirmado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar pagamento fake');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading || !accommodation) {
    return (
      <Screen safeArea={true}>
        <View className="px-4 py-4">
          <Text variant="body">Carregando acomodação...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={true}>
      <View className="px-4 py-4 gap-4 pb-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2">
            <Ionicons name="arrow-back" size={22} color={colorValues.textPrimary} />
            <Text variant="body" className="font-medium">Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(StackRoutes.MAIN_TABS, {
                screen: TabRoutes.HOME,
              })
            }
            className="flex-row items-center gap-2 rounded-lg border border-border px-3 py-2"
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color={colorValues.textPrimary} />
            <Text variant="caption" className="font-medium">Início</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text variant="h2" className="font-semibold">Fechamento de acomodação</Text>
          <Text variant="bodySecondary" className="mt-1">
            Selecione período, confira preço atualizado e escolha como fechar o pacote.
          </Text>
        </View>

        {feedback ? (
          <Card className="border-green-200 bg-green-50">
            <Text variant="caption" className="text-green-700">{feedback}</Text>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <Text variant="caption" className="text-red-700">{error}</Text>
          </Card>
        ) : null}

        <Card>
          <Text variant="h3" className="font-semibold">{accommodation.title}</Text>
          <Text variant="caption" className="mt-1">
            {accommodation.accommodationType} • {accommodation.location}
          </Text>
          {accommodation.score != null ? (
            <Text variant="caption" className="mt-1">
              Score: {Number(accommodation.score).toFixed(1)}
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text variant="h3" className="font-semibold">1. Seleção de período</Text>
          <Text variant="caption" className="mt-1">
            Escolha janela de datas (domingo a domingo).
          </Text>

          {loadingCurrentQuote ? (
            <Text variant="caption" className="mt-3">Carregando contexto do pacote atual...</Text>
          ) : canAddToCurrentPackage ? (
            <Card className="mt-3 border-primary-200 bg-primary-50">
              <Text variant="caption" className="text-primary-700">
                Pré-preenchido com datas do curso do pacote atual.
              </Text>
              {currentCourseItem ? (
                <Text variant="caption" className="text-primary-700">
                  Curso: {new Date(currentCourseItem.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(currentCourseItem.endDate).toLocaleDateString('pt-BR')}
                </Text>
              ) : null}
            </Card>
          ) : null}

          <Text variant="caption" className="mt-3">Opção de pricing</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {pricingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedPricing(option)}
                className={`rounded-lg border px-3 py-2 ${
                  selectedPricing?.id === option.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border bg-white'
                }`}
              >
                <Text variant="caption">{option.periodOption}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text variant="caption" className="mt-3">Data inicial</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {startDateOptions.map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setStartDate(value)}
                className={`rounded-lg border px-3 py-2 ${
                  startDate === value ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                }`}
              >
                <Text variant="caption">
                  {new Date(`${value}T00:00:00.000Z`).toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text variant="caption" className="mt-3">Data final / duração</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {[1, 2, 4, 8, 12].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setWeeks(value)}
                className={`rounded-lg border px-3 py-2 ${
                  weeks === value ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                }`}
              >
                <Text variant="caption">
                  {value} sem • até{' '}
                  {new Date(`${addDays(startDate, value * 7)}T00:00:00.000Z`).toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Text variant="caption">
              Início: {new Date(`${startDate}T00:00:00.000Z`).toLocaleDateString('pt-BR')}
            </Text>
            <Text variant="caption">
              Fim: {new Date(`${endDate}T00:00:00.000Z`).toLocaleDateString('pt-BR')}
            </Text>
            <Text variant="caption">Duração: {weeks} semana(s) • {durationDays} dias</Text>
            <Text variant="caption">
              Preço base: {formatMoney(resolvedPricing?.basePrice, resolvedPricing?.currency ?? 'CAD')} / semana
            </Text>
            <Text variant="body" className="font-medium mt-1">
              {loadingPricing
                ? 'Calculando preço...'
                : `Preço final: ${formatMoney(
                    resolvedPricing?.calculatedAmount ?? resolvedPricing?.breakdown?.totalAmount,
                    resolvedPricing?.currency ?? 'CAD',
                  )}`}
            </Text>
          </View>
        </Card>

        <Card>
          <Text variant="h3" className="font-semibold">2. Confirmar seleção</Text>
          <Text variant="caption" className="mt-1">
            Escolha se quer adicionar ao pacote atual ou fechar somente acomodação.
          </Text>

          {canAddToCurrentPackage && isDirectCatalogFlow ? (
            <Card className="mt-3 border-amber-200 bg-amber-50">
              <Text variant="caption" className="text-amber-700">
                Você já tem matrícula/pacote em andamento. Sugerimos as datas do curso atual e
                você pode ajustar antes de adicionar ao pacote.
              </Text>
            </Card>
          ) : null}

          <Button
            className="mt-3"
            onPress={addToCurrentPackage}
            disabled={!resolvedPricing || !canAddToCurrentPackage || addingToPackage || loadingPricing}
          >
            {addingToPackage ? 'Adicionando ao pacote...' : 'Adicionar ao pacote atual'}
          </Button>

          <Button
            className="mt-2"
            variant="outline"
            onPress={createStandaloneQuote}
            disabled={!resolvedPricing || creatingQuote || loadingPricing}
          >
            {creatingQuote ? 'Fechando pacote...' : 'Fechar somente acomodação'}
          </Button>

          {!canAddToCurrentPackage ? (
            <Text variant="caption" className="mt-2 text-slate-500">
              Nenhum pacote com curso elegível encontrado para adicionar acomodação neste momento.
            </Text>
          ) : null}
        </Card>

        {quote ? (
          <Card>
            <Text variant="h3" className="font-semibold">3. Pacote fechado</Text>
            <Text variant="caption" className="mt-2">Tipo: {quote.type}</Text>
            {quote.packageStatus ? <Text variant="caption">Status: {quote.packageStatus}</Text> : null}
            {quote.nextStep ? <Text variant="caption">Próximo passo: {quote.nextStep}</Text> : null}
            <Text variant="caption">
              Acomodação: {formatMoney(quote.accommodationAmount, quote.currency)}
            </Text>
            <Text variant="caption">Total: {formatMoney(quote.totalAmount, quote.currency)}</Text>
            <Text variant="caption">
              Entrada (30%): {formatMoney(quote.downPaymentAmount, quote.currency)}
            </Text>
            <Text variant="caption">Saldo: {formatMoney(quote.remainingAmount, quote.currency)}</Text>

            {quoteOrigin === 'standalone' ? (
              <>
                {payStatus === 'paid' ? (
                  <Text variant="body" className="mt-3 text-green-700 font-medium">
                    Pagamento da entrada confirmado.
                  </Text>
                ) : (
                  <Button className="mt-3" onPress={payDownPaymentFake} disabled={paying}>
                    {paying ? 'Processando...' : 'Pagar entrada (fake)'}
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="mt-3"
                onPress={() => {
                  if (quote.enrollment?.id) {
                    navigation.navigate(StackRoutes.ENROLLMENT_DETAIL, {
                      enrollmentId: quote.enrollment.id,
                    });
                    return;
                  }
                  navigation.navigate(StackRoutes.ACADEMIC_JOURNEY);
                }}
              >
                Ir para jornada / checkout
              </Button>
            )}

            <Button
              className="mt-2"
              variant="outline"
              onPress={() =>
                navigation.navigate(StackRoutes.MAIN_TABS, { screen: TabRoutes.ACCOMMODATION })
              }
            >
              Voltar ao catálogo
            </Button>
            <Button
              className="mt-2"
              variant="ghost"
              onPress={() =>
                navigation.navigate(StackRoutes.PACKAGE_CART, {
                  quoteId: quote?.id ?? currentQuote?.id,
                })
              }
            >
              Abrir pacote / carrinho
            </Button>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
