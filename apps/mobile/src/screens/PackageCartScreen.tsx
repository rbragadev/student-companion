import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes, TabRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentIntentApi } from '../services/api/enrollmentIntentApi';
import type { EnrollmentQuote } from '../types/enrollment.types';
import { clearDraftQuoteId, getDraftQuoteId, setDraftQuoteId } from '../utils/draftQuoteStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, typeof StackRoutes.PACKAGE_CART>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.PACKAGE_CART>;

function money(value: number | undefined, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

function packageTypeLabel(type?: string) {
  if (type === 'course_only') return 'Curso';
  if (type === 'course_with_accommodation') return 'Curso + Acomodação';
  if (type === 'accommodation_only') return 'Acomodação';
  return '-';
}

export default function PackageCartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [quoteIdFromRoute, setQuoteIdFromRoute] = React.useState<string | undefined>(
    route.params?.quoteId,
  );
  const [storedQuoteId, setStoredQuoteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setQuoteIdFromRoute(route.params?.quoteId);
  }, [route.params?.quoteId]);

  React.useEffect(() => {
    if (!userId) return;
    void (async () => {
      const draftId = await getDraftQuoteId(userId);
      setStoredQuoteId(draftId);
    })();
  }, [userId]);

  const effectiveQuoteId = quoteIdFromRoute ?? storedQuoteId ?? undefined;

  const quoteQuery = useQuery({
    queryKey: ['quotes', effectiveQuoteId ? 'by-id' : 'current', effectiveQuoteId ?? userId],
    queryFn: () =>
      effectiveQuoteId
        ? enrollmentIntentApi.getQuoteById(effectiveQuoteId)
        : enrollmentIntentApi.getCurrentQuoteByStudent(userId ?? ''),
    enabled: Boolean(effectiveQuoteId || userId),
    refetchOnMount: true,
  });

  const openIntentQuery = useQuery({
    queryKey: ['enrollment-intent', 'open', userId],
    queryFn: () => enrollmentIntentApi.getOpenIntentByStudent(userId ?? ''),
    enabled: Boolean(userId),
    refetchOnMount: true,
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ quoteId, itemId }: { quoteId: string; itemId: string }) =>
      enrollmentIntentApi.removeQuoteItem(quoteId, itemId),
    onSuccess: (updatedQuote) => {
      if (!updatedQuote?.id) {
        quoteQuery.refetch();
        return;
      }
      setQuoteIdFromRoute(updatedQuote.id);
      setStoredQuoteId(updatedQuote.id);
      if (userId) {
        void setDraftQuoteId(userId, updatedQuote.id);
      }
      navigation.setParams({ quoteId: updatedQuote.id });
    },
  });

  const removeQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => enrollmentIntentApi.removeQuote(quoteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['quotes'] });
    },
    onSuccess: () => {
      setQuoteIdFromRoute(undefined);
      setStoredQuoteId(null);
      navigation.setParams({ quoteId: undefined });
      if (userId) {
        void clearDraftQuoteId(userId);
      }
      queryClient.removeQueries({ queryKey: ['quotes', 'by-id'] });
    },
  });

  const quote: EnrollmentQuote | null = quoteQuery.data ?? null;
  const items = quote?.items ?? [];
  const hasSingleItem = items.length <= 1;
  const hasOnlyCourse = hasSingleItem && items[0]?.itemType === 'course';
  const isSubmissionLocked = Boolean(
    quote?.packageStatus &&
      ['proposal_sent', 'awaiting_approval', 'approved', 'checkout_available', 'payment_pending', 'paid'].includes(
        quote.packageStatus,
      ),
  );
  const hasOpenIntent = Boolean(openIntentQuery.data?.id);
  const isCheckoutAvailable = quote?.packageStatus === 'checkout_available';
  const isBlockedByOpenIntent = hasOpenIntent && !isSubmissionLocked && !isCheckoutAvailable;

  React.useEffect(() => {
    if (!quote?.id || !userId) return;
    void setDraftQuoteId(userId, quote.id);
  }, [quote?.id, userId]);

  const goToAdjustCourse = () => {
    const courseId = quote?.coursePricing?.course?.id;
    if (!courseId) return;
    navigation.navigate(StackRoutes.ENROLLMENT_INTENT, { courseId, quoteId: quote?.id });
  };

  const goToAdjustAccommodation = () => {
    const accommodationItem = quote?.items?.find((entry) => entry.itemType === 'accommodation');
    const accommodationId = quote?.accommodationPricing?.accommodation?.id;
    const courseId = quote?.coursePricing?.course?.id;
    if (!accommodationItem) {
      if (courseId) {
        navigation.navigate(StackRoutes.ENROLLMENT_INTENT, {
          courseId,
          initialStep: 2,
          quoteId: quote?.id,
        });
        return;
      }
      navigation.navigate(StackRoutes.MAIN_TABS, { screen: TabRoutes.COURSES });
      return;
    }
    if (!accommodationId) {
      if (courseId) {
        navigation.navigate(StackRoutes.ENROLLMENT_INTENT, {
          courseId,
          initialStep: 2,
          quoteId: quote?.id,
        });
        return;
      }
      navigation.navigate(StackRoutes.MAIN_TABS, { screen: TabRoutes.ACCOMMODATION });
      return;
    }
    navigation.navigate(StackRoutes.ACCOMMODATION_CHECKOUT, {
      accommodationId,
      mode: quote?.type === 'accommodation_only' ? 'standalone' : 'package',
      initialStartDate: accommodationItem.startDate?.slice(0, 10),
      initialEndDate: accommodationItem.endDate?.slice(0, 10),
    });
  };

  const handlePrimaryProgress = () => {
    if (isSubmissionLocked) {
      navigation.navigate(StackRoutes.ACADEMIC_JOURNEY);
      return;
    }

    if (hasOpenIntent) {
      return;
    }

    if (quote?.enrollment?.id && quote?.packageStatus === 'checkout_available') {
      navigation.navigate(StackRoutes.ENROLLMENT_CHECKOUT, { enrollmentId: quote.enrollment.id });
      return;
    }

    if (quote?.enrollment?.id) {
      navigation.navigate(StackRoutes.ENROLLMENT_DETAIL, { enrollmentId: quote.enrollment.id });
      return;
    }

    const courseId = quote?.coursePricing?.course?.id;
    if (courseId) {
      navigation.navigate(StackRoutes.ENROLLMENT_INTENT, {
        courseId,
        initialStep: 3,
        quoteId: quote?.id,
      });
      return;
    }
    goToAdjustCourse();
  };

  const handleItemAction = (item: NonNullable<EnrollmentQuote['items']>[number]) => {
    if (isSubmissionLocked) return;
    if (hasSingleItem) {
      if (quote?.id) {
        removeQuoteMutation.mutate(quote.id);
      }
      return;
    }

    removeItemMutation.mutate({ quoteId: quote!.id, itemId: item.id });
  };

  return (
    <Screen safeArea={true}>
      <View className="px-4 py-4 gap-4">
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
          >
            <Ionicons name="home-outline" size={18} color={colorValues.textPrimary} />
            <Text variant="caption" className="font-medium">Início</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text variant="h2" className="font-semibold">Pacote / Carrinho</Text>
          <Text variant="bodySecondary" className="mt-1">
            Revise itens, datas, valores e escolha o próximo passo.
          </Text>
        </View>

        {quoteQuery.isLoading ? <Text variant="body">Carregando pacote...</Text> : null}

        {quoteQuery.isError ? (
          <Card className="border-red-200 bg-red-50">
            <Text variant="caption" className="text-red-700">
              Não foi possível carregar o pacote atual.
            </Text>
            <Button className="mt-3" onPress={() => quoteQuery.refetch()}>Tentar novamente</Button>
          </Card>
        ) : null}

        {!quoteQuery.isLoading && !quote && (
          <Card>
            <Text variant="h3" className="font-semibold">Sem pacote em andamento</Text>
            <Text variant="caption" className="mt-2">
              Você pode iniciar por Cursos/Intercâmbio ou por Acomodações.
            </Text>
            <Button
              className="mt-3"
              onPress={() =>
                navigation.navigate(StackRoutes.MAIN_TABS, {
                  screen: TabRoutes.HOME,
                })
              }
            >
              Explorar opções
            </Button>
          </Card>
        )}

        {quote && (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">Resumo do pacote</Text>
              <View className="mt-3 gap-1">
                <Text variant="caption">Tipo: {packageTypeLabel(quote.type)}</Text>
                {quote.packageStatus ? (
                  <Text variant="caption">Status: {quote.packageStatus}</Text>
                ) : null}
                {quote.nextStep ? <Text variant="caption">Próximo passo: {quote.nextStep}</Text> : null}
                <Text variant="caption">Total: {money(quote.totalAmount, quote.currency)}</Text>
                <Text variant="caption">
                  Entrada ({Number(quote.downPaymentPercentage).toFixed(0)}%):{' '}
                  {money(quote.downPaymentAmount, quote.currency)}
                </Text>
                <Text variant="caption">Saldo: {money(quote.remainingAmount, quote.currency)}</Text>
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Itens selecionados</Text>
              <View className="mt-3 gap-2">
                {items.map((item) => (
                  <View key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Text variant="caption" className="font-semibold">
                      {item.itemType === 'course' ? 'Curso' : 'Acomodação'}
                    </Text>
                    <Text variant="caption">
                      {new Date(item.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(item.endDate).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text variant="caption">
                      {money(item.amount, quote.currency)}
                    </Text>
                    <View className="mt-2 flex-row items-center gap-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        onPress={() => {
                          if (item.itemType === 'course') {
                            goToAdjustCourse();
                            return;
                          }
                          goToAdjustAccommodation();
                        }}
                        disabled={isSubmissionLocked}
                      >
                        {item.itemType === 'course' ? 'Alterar curso/datas' : 'Ajustar acomodação'}
                      </Button>
                      <TouchableOpacity
                        onPress={() => handleItemAction(item)}
                        disabled={
                          removeItemMutation.isPending ||
                          removeQuoteMutation.isPending ||
                          isSubmissionLocked
                        }
                        className={`h-11 w-11 items-center justify-center rounded-lg border ${
                          removeItemMutation.isPending || removeQuoteMutation.isPending || isSubmissionLocked
                            ? 'border-slate-200 bg-slate-100'
                            : 'border-red-200 bg-red-50'
                        }`}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={
                            removeItemMutation.isPending || removeQuoteMutation.isPending || isSubmissionLocked
                              ? colorValues.textSecondary
                              : '#dc2626'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              {hasSingleItem && !isSubmissionLocked ? (
                <Text variant="caption" className="mt-2">
                  Ao remover o último item, o carrinho é limpo para iniciar novo fluxo.
                </Text>
              ) : null}
              {isSubmissionLocked ? (
                <Text variant="caption" className="mt-2">
                  Pacote enviado/fechado. Alterações ficam bloqueadas até resposta da escola.
                </Text>
              ) : null}
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Próximo passo</Text>
              {hasOnlyCourse ? (
                <Button
                  className="mt-3"
                  variant="outline"
                  onPress={goToAdjustAccommodation}
                  disabled={isSubmissionLocked}
                >
                  Adicionar acomodação
                </Button>
              ) : null}
              <Button
                className="mt-2"
                onPress={handlePrimaryProgress}
                disabled={isBlockedByOpenIntent}
              >
                {quote.packageStatus === 'checkout_available'
                  ? 'Ir para checkout'
                  : isSubmissionLocked
                    ? 'Ver meus fechamentos'
                    : 'Seguir para fechamento'}
              </Button>
              {hasOpenIntent ? (
                <Text variant="caption" className="mt-2">
                  Envio bloqueado: você já possui uma intenção em aberto. Você pode continuar
                  montando este carrinho e enviar após resposta da escola.
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}
