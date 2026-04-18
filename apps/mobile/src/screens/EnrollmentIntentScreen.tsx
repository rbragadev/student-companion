import React from 'react';
import { Image, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { enrollmentIntentApi } from '../services/api/enrollmentIntentApi';
import type {
  CoursePricing,
  AccommodationPricing,
  EnrollmentIntent,
  EnrollmentQuote,
} from '../types/enrollment.types';
import { colorValues } from '../utils/design-tokens';
import { useAuth } from '../contexts/AuthContext';
import { userQueryKeys } from '../hooks/api/useUserProfile';
import { enrollmentApi } from '../services/api/enrollmentApi';
import type { Accommodation } from '../types/accommodation.types';
import { accommodationApi } from '../services/api/accommodationApi';
import { courseApi } from '../services/api/courseApi';
import type { Course, CourseOffer } from '../types/course.types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.ENROLLMENT_INTENT>;
type Step = 1 | 2 | 3 | 4;

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isSundayIso(isoDate: string): boolean {
  if (!isIsoDate(isoDate)) return false;
  return new Date(`${isoDate}T00:00:00.000Z`).getUTCDay() === 0;
}

function alignToNextSunday(isoDate: string): string {
  if (!isIsoDate(isoDate)) return isoDate;
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  const day = date.getUTCDay();
  if (day === 0) return isoDate;
  date.setUTCDate(date.getUTCDate() + (7 - day));
  return date.toISOString().slice(0, 10);
}

function listSundaysBetween(startIso: string, endIso: string, limit = 12): string[] {
  if (!isIsoDate(startIso) || !isIsoDate(endIso)) return [];
  const values: string[] = [];
  let cursor = alignToNextSunday(startIso);
  let guard = 0;
  while (cursor <= endIso && guard < limit) {
    values.push(cursor);
    cursor = addDays(cursor, 7);
    guard += 1;
  }
  return values;
}

function diffDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00.000Z`).getTime();
  const end = new Date(`${endIso}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function isWeeklyRangeValid(startIso: string, endIso: string): boolean {
  if (!isIsoDate(startIso) || !isIsoDate(endIso)) return false;
  const days = diffDays(startIso, endIso);
  return days > 0 && days % 7 === 0 && isSundayIso(startIso) && isSundayIso(endIso);
}

function formatMoney(value: number, currency: string): string {
  return `${Number(value).toFixed(2)} ${currency}`;
}

export default function EnrollmentIntentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { courseId } = route.params;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plus28Iso = React.useMemo(
    () => new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    [],
  );

  const [step, setStep] = React.useState<Step>(1);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [quoteLoading, setQuoteLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [course, setCourse] = React.useState<Course | null>(null);
  const [courseOffers, setCourseOffers] = React.useState<CourseOffer[]>([]);
  const [openIntent, setOpenIntent] = React.useState<EnrollmentIntent | null>(null);
  const [hasActiveEnrollment, setHasActiveEnrollment] = React.useState(false);

  const [selectedOfferId, setSelectedOfferId] = React.useState('');
  const [courseStartDate, setCourseStartDate] = React.useState(todayIso);
  const [courseEndDate, setCourseEndDate] = React.useState(plus28Iso);
  const [coursePricing, setCoursePricing] = React.useState<CoursePricing | null>(null);

  const [recommendedAccommodations, setRecommendedAccommodations] = React.useState<Accommodation[]>(
    [],
  );
  const [allAccommodations, setAllAccommodations] = React.useState<Accommodation[]>([]);
  const [showAllAccommodations, setShowAllAccommodations] = React.useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = React.useState('');
  const [acceptedNonRecommendedAccommodation, setAcceptedNonRecommendedAccommodation] =
    React.useState(false);
  const [accommodationStartDate, setAccommodationStartDate] = React.useState(todayIso);
  const [accommodationEndDate, setAccommodationEndDate] = React.useState(plus28Iso);
  const [accommodationPricing, setAccommodationPricing] = React.useState<AccommodationPricing | null>(
    null,
  );
  const [selectedAccommodationPreview, setSelectedAccommodationPreview] =
    React.useState<Accommodation | null>(null);
  const [modalAccommodationPricing, setModalAccommodationPricing] =
    React.useState<AccommodationPricing | null>(null);
  const [modalPricingLoading, setModalPricingLoading] = React.useState(false);

  const [quotePreview, setQuotePreview] = React.useState<EnrollmentQuote | null>(null);
  const [resultType, setResultType] = React.useState<'auto_approve' | 'proposal'>('proposal');
  const [createdEnrollmentId, setCreatedEnrollmentId] = React.useState<string | null>(null);

  const selectedOffer = React.useMemo(
    () => courseOffers.find((item) => item.id === selectedOfferId) ?? null,
    [courseOffers, selectedOfferId],
  );

  const selectedClassGroupId = selectedOffer?.classGroupId ?? '';
  const selectedPeriodId = selectedOffer?.academicPeriodId ?? '';

  const weeklyCourseStartOptions = React.useMemo(() => {
    if (!selectedOffer) return [];
    return listSundaysBetween(
      selectedOffer.startDate.slice(0, 10),
      selectedOffer.endDate.slice(0, 10),
    );
  }, [selectedOffer]);

  const weeklyAccommodationOptions = React.useMemo(() => {
    if (!isIsoDate(accommodationStartDate)) return [];
    return [1, 2, 4, 8, 12, 16].map((weeks) => ({
      weeks,
      endDate: addDays(accommodationStartDate, weeks * 7),
    }));
  }, [accommodationStartDate]);

  const weeklyAccommodationStartOptions = React.useMemo(() => {
    if (!isIsoDate(courseStartDate)) return [];
    const alignedCourseStart = alignToNextSunday(courseStartDate);
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(alignedCourseStart, offset * 7));
  }, [courseStartDate]);

  const isSelectedAccommodationRecommended = React.useMemo(() => {
    if (!selectedAccommodationId) return true;
    return recommendedAccommodations.some((item) => item.id === selectedAccommodationId);
  }, [recommendedAccommodations, selectedAccommodationId]);

  React.useEffect(() => {
    const run = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [courseDetail, offers, pendingIntent, activeEnrollment, recommended, all] =
          await Promise.all([
            courseApi.getCourseById(courseId),
            courseApi.getCourseOffers(courseId),
            enrollmentIntentApi.getOpenIntentByStudent(userId),
            enrollmentApi.getActiveEnrollmentByStudent(userId),
            enrollmentIntentApi.getRecommendedAccommodationsByCourse(courseId),
            accommodationApi.getAccommodations().catch(() => []),
          ]);

        setCourse(courseDetail);
        setCourseOffers(offers);
        const firstOffer = offers[0] ?? null;
        if (firstOffer) {
          setSelectedOfferId(firstOffer.id);
          const start = firstOffer.startDate.slice(0, 10);
          const weeklyStart = alignToNextSunday(start);
          const initialEnd = addDays(weeklyStart, 28);
          setCourseStartDate(courseDetail.periodType === 'fixed' ? start : weeklyStart);
          setCourseEndDate(
            courseDetail.periodType === 'fixed' ? firstOffer.endDate.slice(0, 10) : initialEnd,
          );
          setAccommodationStartDate(weeklyStart);
          setAccommodationEndDate(initialEnd);
        }
        setOpenIntent(pendingIntent);
        setHasActiveEnrollment(!!activeEnrollment);
        setRecommendedAccommodations(recommended.slice(0, 3));
        setAllAccommodations(
          [...all].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0)),
        );
        setSelectedAccommodationId(pendingIntent?.accommodation?.id ?? '');
        if (pendingIntent?.id) {
          const currentQuote = await enrollmentIntentApi.getQuoteByIntent(pendingIntent.id);
          setQuotePreview(currentQuote);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar fluxo de matrícula');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [courseId, userId]);

  React.useEffect(() => {
    const run = async () => {
      if (!selectedOffer || !selectedPeriodId) {
        setCoursePricing(null);
        setQuotePreview(null);
        return;
      }

      try {
        const pricing = await enrollmentIntentApi.getCoursePricing(courseId, selectedPeriodId, {
          startDate: toIsoDate(courseStartDate),
          endDate: toIsoDate(courseEndDate),
        });
        setCoursePricing(pricing);
      } catch (err) {
        setCoursePricing(null);
        setError(err instanceof Error ? err.message : 'Preço do curso indisponível para o período');
      }
    };

    void run();
  }, [courseEndDate, courseId, courseStartDate, selectedOffer, selectedPeriodId]);

  React.useEffect(() => {
    const run = async () => {
      if (!selectedAccommodationId) {
        setAccommodationPricing(null);
        return;
      }

      try {
        const periodName = selectedOffer?.academicPeriodName;
        const pricing = await enrollmentIntentApi.getAccommodationPricing(
          selectedAccommodationId,
          periodName,
          {
            startDate: toIsoDate(accommodationStartDate),
            endDate: toIsoDate(accommodationEndDate),
          },
        );
        setAccommodationPricing(pricing);
      } catch (err) {
        setAccommodationPricing(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Preço da acomodação indisponível para o período selecionado',
        );
      }
    };

    void run();
  }, [
    selectedAccommodationId,
    selectedOffer,
    selectedPeriodId,
    accommodationStartDate,
    accommodationEndDate,
  ]);

  const selectAccommodation = React.useCallback(
    (accommodationId: string) => {
      setSelectedAccommodationId(accommodationId);
      setAcceptedNonRecommendedAccommodation(false);
      if (isIsoDate(courseStartDate)) {
        const start = alignToNextSunday(courseStartDate);
        const weeks = isWeeklyRangeValid(accommodationStartDate, accommodationEndDate)
          ? diffDays(accommodationStartDate, accommodationEndDate) / 7
          : 4;
        setAccommodationStartDate(start);
        setAccommodationEndDate(addDays(start, weeks * 7));
      }
    },
    [accommodationEndDate, accommodationStartDate, courseStartDate],
  );

  const openAccommodationModal = React.useCallback(
    async (item: Accommodation) => {
      setSelectedAccommodationPreview(item);
      setModalAccommodationPricing(null);
      try {
        setModalPricingLoading(true);
        const pricing = await enrollmentIntentApi.getAccommodationPricing(
          item.id,
          selectedOffer?.academicPeriodName,
          {
            startDate: toIsoDate(accommodationStartDate),
            endDate: toIsoDate(accommodationEndDate),
          },
        );
        setModalAccommodationPricing(pricing);
      } catch {
        setModalAccommodationPricing(null);
      } finally {
        setModalPricingLoading(false);
      }
    },
    [selectedOffer?.academicPeriodName, accommodationStartDate, accommodationEndDate],
  );

  const canGoToStep2 = React.useMemo(() => {
    if (!coursePricing || !selectedOffer) return false;
    if (!isIsoDate(courseStartDate) || !isIsoDate(courseEndDate)) return false;

    const start = new Date(`${courseStartDate}T00:00:00.000Z`);
    const end = new Date(`${courseEndDate}T00:00:00.000Z`);
    if (end <= start) return false;

    if (course?.periodType === 'weekly') {
      if (!isWeeklyRangeValid(courseStartDate, courseEndDate)) return false;
    }

    return true;
  }, [
    coursePricing,
    selectedOffer,
    courseStartDate,
    courseEndDate,
    course?.periodType,
  ]);

  const rebuildQuote = React.useCallback(async () => {
    if (!coursePricing) {
      setQuotePreview(null);
      return;
    }
    if (!isIsoDate(courseStartDate) || !isIsoDate(courseEndDate)) {
      setQuotePreview(null);
      return;
    }
    if (course?.periodType === 'weekly' && !isWeeklyRangeValid(courseStartDate, courseEndDate)) {
      setQuotePreview(null);
      return;
    }
    if (selectedAccommodationId && !isWeeklyRangeValid(accommodationStartDate, accommodationEndDate)) {
      setQuotePreview(null);
      return;
    }

    const items = [
      {
        itemType: 'course' as const,
        coursePricingId: coursePricing.id,
        referenceId: coursePricing.id,
        startDate: toIsoDate(courseStartDate),
        endDate: toIsoDate(courseEndDate),
      },
      ...(accommodationPricing &&
      isIsoDate(accommodationStartDate) &&
      isIsoDate(accommodationEndDate)
        ? [
            {
              itemType: 'accommodation' as const,
              accommodationPricingId: accommodationPricing.id,
              referenceId: accommodationPricing.id,
              startDate: toIsoDate(accommodationStartDate),
              endDate: toIsoDate(accommodationEndDate),
            },
          ]
        : []),
    ];

    try {
      setQuoteLoading(true);
      const quote = await enrollmentIntentApi.createQuote({
        downPaymentPercentage: 30,
        items,
      });
      setQuotePreview(quote);
    } catch (err) {
      setQuotePreview(null);
      setError(err instanceof Error ? err.message : 'Falha ao calcular pacote');
    } finally {
      setQuoteLoading(false);
    }
  }, [
    coursePricing,
    accommodationPricing,
    courseStartDate,
    courseEndDate,
    accommodationStartDate,
    accommodationEndDate,
    course?.periodType,
    selectedAccommodationId,
  ]);

  React.useEffect(() => {
    if (step >= 2) {
      void rebuildQuote();
    }
  }, [rebuildQuote, step]);

  const submitIntent = async () => {
    if (!userId || !coursePricing || !selectedClassGroupId || !selectedPeriodId || !quotePreview) return;

    try {
      setSaving(true);
      setError(null);

      const createdIntent = await enrollmentIntentApi.createEnrollmentIntent({
        studentId: userId,
        courseId,
        classGroupId: selectedClassGroupId,
        academicPeriodId: selectedPeriodId,
        accommodationId: selectedAccommodationId || undefined,
      });

      await enrollmentIntentApi.createQuote({
        enrollmentIntentId: createdIntent.id,
        downPaymentPercentage: 30,
        items:
          quotePreview.items?.map((item) => ({
            itemType: item.itemType,
            referenceId: item.referenceId,
            coursePricingId: item.itemType === 'course' ? item.referenceId : undefined,
            accommodationPricingId:
              item.itemType === 'accommodation' ? item.referenceId : undefined,
            startDate: item.startDate,
            endDate: item.endDate,
          })) ?? [],
      });

      await queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(userId) });
      if (createdIntent.enrollment?.id) {
        setCreatedEnrollmentId(createdIntent.enrollment.id);
      }
      setResultType(course?.autoApproveIntent ? 'auto_approve' : 'proposal');
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao finalizar pacote');
    } finally {
      setSaving(false);
    }
  };

  const renderStepHeader = () => (
    <View className="flex-row items-center gap-2">
      {[1, 2, 3, 4].map((value) => (
        <View
          key={value}
          className={`h-2 flex-1 rounded-full ${step >= value ? 'bg-primary-500' : 'bg-border'}`}
        />
      ))}
    </View>
  );

  const renderCourseStep = () => (
    <>
      <Card>
        <Text variant="h3" className="font-semibold">Etapa 1 — Curso e datas</Text>
        <Text variant="caption" className="mt-1">
          Selecione a oferta de datas do curso e ajuste o intervalo válido antes de avançar.
        </Text>
        <View className="mt-3 gap-2">
          <Text variant="caption">Curso</Text>
          <Text variant="body" className="font-medium">{course?.programName ?? 'Curso'}</Text>
          <Text variant="caption">
            Tipo de período: {course?.periodType === 'weekly' ? 'Semanal' : 'Fixo'}
          </Text>
        </View>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">Oferta disponível</Text>
        <View className="mt-3 gap-2">
          {courseOffers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              onPress={() => {
                setSelectedOfferId(offer.id);
                if (course?.periodType === 'fixed') {
                  setCourseStartDate(offer.startDate.slice(0, 10));
                  setCourseEndDate(offer.endDate.slice(0, 10));
                  setAccommodationStartDate(offer.startDate.slice(0, 10));
                  setAccommodationEndDate(addDays(offer.startDate.slice(0, 10), 28));
                } else {
                  const weeklyStart = alignToNextSunday(offer.startDate.slice(0, 10));
                  setCourseStartDate(weeklyStart);
                  setCourseEndDate(addDays(weeklyStart, 28));
                  setAccommodationStartDate(weeklyStart);
                  setAccommodationEndDate(addDays(weeklyStart, 28));
                }
              }}
              activeOpacity={0.8}
              className={`rounded-lg border px-3 py-2 ${
                selectedOfferId === offer.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-border bg-white'
              }`}
            >
              <Text variant="body">Oferta de datas</Text>
              <Text variant="caption">
                {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
              </Text>
              <Text variant="caption">
                Preço base: {formatMoney(Number(offer.basePrice), offer.currency)}
              </Text>
            </TouchableOpacity>
          ))}
          {courseOffers.length === 0 && (
            <Text variant="caption">Nenhuma oferta ativa disponível para este curso.</Text>
          )}
        </View>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">
          Datas do curso ({course?.periodType === 'weekly' ? 'semanal' : 'fixo'})
        </Text>
        <Text variant="caption" className="mt-1">
          Formato obrigatório: YYYY-MM-DD.
        </Text>
        <View className="mt-3 gap-2">
          <Text variant="caption">Início</Text>
          <TextInput
            value={courseStartDate}
            editable={false}
            className="h-11 rounded-lg border border-border bg-surfaceSecondary px-3"
          />
          <Text variant="caption">Fim</Text>
          <TextInput
            value={courseEndDate}
            editable={false}
            className="h-11 rounded-lg border border-border bg-surfaceSecondary px-3"
          />
          {course?.periodType === 'weekly' && (
            <Text variant="caption">
              Regras weekly: intervalo de 7 em 7 dias e datas de domingo a domingo.
            </Text>
          )}
          {course?.periodType === 'weekly' && (
            <>
              <Text variant="caption" className="mt-1">Selecione o início (domingos disponíveis)</Text>
              <View className="flex-row flex-wrap gap-2">
                {weeklyCourseStartOptions.map((startOption) => {
                  const selected = startOption === courseStartDate;
                  return (
                    <TouchableOpacity
                      key={`course-start-${startOption}`}
                      onPress={() => {
                        const weeks = isWeeklyRangeValid(courseStartDate, courseEndDate)
                          ? diffDays(courseStartDate, courseEndDate) / 7
                          : 4;
                        setCourseStartDate(startOption);
                        setCourseEndDate(addDays(startOption, weeks * 7));
                      }}
                      className={`rounded-lg border px-3 py-2 ${
                        selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                      }`}
                    >
                      <Text variant="caption">
                        {new Date(`${startOption}T00:00:00.000Z`).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text variant="caption" className="mt-1">Selecione a duração</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 4, 8, 12].map((weeks) => {
                  const candidateEnd = addDays(courseStartDate, weeks * 7);
                  const selected = candidateEnd === courseEndDate;
                  return (
                    <TouchableOpacity
                      key={`course-week-${weeks}`}
                      onPress={() => setCourseEndDate(candidateEnd)}
                      className={`rounded-lg border px-3 py-2 ${
                        selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                      }`}
                    >
                      <Text variant="caption">
                        {weeks} sem • até {new Date(`${candidateEnd}T00:00:00.000Z`).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">Preço do curso</Text>
        {coursePricing ? (
          <>
            {course?.periodType === 'weekly' ? (
              <>
                <Text variant="body" className="mt-2">
                  {formatMoney(coursePricing.basePrice, coursePricing.currency)} per week
                </Text>
                <Text variant="caption" className="mt-1">
                  Total do período: {formatMoney(coursePricing.calculatedAmount ?? 0, coursePricing.currency)}
                </Text>
                <Text variant="caption" className="mt-1">
                  Duração selecionada: {coursePricing.weeks ?? Math.max(1, diffDays(courseStartDate, courseEndDate) / 7)} semana(s)
                </Text>
              </>
            ) : (
              <Text variant="body" className="mt-2">
                Total price: {formatMoney(coursePricing.calculatedAmount ?? coursePricing.basePrice, coursePricing.currency)}
              </Text>
            )}
          </>
        ) : (
          <Text variant="body" className="mt-2">Selecione período válido</Text>
        )}
      </Card>

      <Button onPress={() => setStep(2)} disabled={!canGoToStep2}>
        Avançar para acomodação
      </Button>
    </>
  );

  const renderAccommodationStep = () => (
    <>
      <Card>
        <Text variant="h3" className="font-semibold">Etapa 2 — Acomodação (Opcional)</Text>
        <Text variant="caption" className="mt-1">
          Recomendadas no topo. Você pode escolher outra no catálogo completo ou seguir sem acomodação.
        </Text>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">Recomendadas</Text>
        <View className="mt-3 gap-2">
          {recommendedAccommodations.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                void openAccommodationModal(item);
              }}
              activeOpacity={0.8}
              className={`rounded-lg border px-3 py-2 ${
                selectedAccommodationId === item.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-border bg-white'
              }`}
            >
              <Text variant="body" className="font-medium">{item.title}</Text>
              <Text variant="caption">
                {item.accommodationType} • CAD {(item.priceInCents / 100).toLocaleString()}/{item.priceUnit}
              </Text>
              {selectedAccommodationId === item.id && accommodationPricing && (
                <Text variant="caption" className="text-primary-700">
                  Preço período atual: {formatMoney(accommodationPricing.calculatedAmount ?? 0, accommodationPricing.currency)}
                </Text>
              )}
              {!!item.recommendationBadge && (
                <Text variant="caption" className="text-primary-700">{item.recommendationBadge}</Text>
              )}
            </TouchableOpacity>
          ))}
          {recommendedAccommodations.length === 0 && (
            <Text variant="caption">Sem recomendações para este contexto.</Text>
          )}
        </View>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">Catálogo completo</Text>
        <Button
          variant="outline"
          className="mt-3"
          onPress={() => setShowAllAccommodations((value) => !value)}
        >
          {showAllAccommodations ? 'Ocultar catálogo' : 'Ver todas'}
        </Button>
        {showAllAccommodations && (
          <View className="mt-3 gap-2">
            {allAccommodations.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  void openAccommodationModal(item);
                }}
                activeOpacity={0.8}
                className={`rounded-lg border px-3 py-2 ${
                  selectedAccommodationId === item.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border bg-white'
                }`}
              >
                <Text variant="body" className="font-medium">{item.title}</Text>
                <Text variant="caption">
                  Score {Number(item.score ?? 0).toFixed(1)} • CAD {(item.priceInCents / 100).toLocaleString()}/{item.priceUnit}
                </Text>
                {selectedAccommodationId === item.id && accommodationPricing && (
                  <Text variant="caption" className="text-primary-700">
                    Preço período atual: {formatMoney(accommodationPricing.calculatedAmount ?? 0, accommodationPricing.currency)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {selectedAccommodationId && (
        <Card>
          <Text variant="h3" className="font-semibold">Acomodação selecionada</Text>
          <Text variant="caption" className="mt-1">
            {(recommendedAccommodations.find((item) => item.id === selectedAccommodationId) ??
              allAccommodations.find((item) => item.id === selectedAccommodationId))
              ?.title ?? 'Acomodação selecionada'}
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => {
                const selected =
                  recommendedAccommodations.find((item) => item.id === selectedAccommodationId) ??
                  allAccommodations.find((item) => item.id === selectedAccommodationId);
                if (selected) {
                  void openAccommodationModal(selected);
                }
              }}
            >
              Ver detalhes
            </Button>
                <Button variant="ghost" className="flex-1" onPress={() => setSelectedAccommodationId('')}>
                  Remover
                </Button>
              </View>
            </Card>
          )}

      {selectedAccommodationId && !isSelectedAccommodationRecommended && (
        <Card className="border-amber-200 bg-amber-50">
          <Text variant="h3" className="font-semibold text-amber-900">
            Acomodação fora da recomendação da escola
          </Text>
          <Text variant="caption" className="mt-2 text-amber-700">
            Você pode seguir mesmo assim, mas essa opção não está entre as recomendadas para o contexto acadêmico.
          </Text>
          <Button
            className="mt-3"
            variant={acceptedNonRecommendedAccommodation ? 'outline' : 'primary'}
            onPress={() => setAcceptedNonRecommendedAccommodation((value) => !value)}
          >
            {acceptedNonRecommendedAccommodation ? 'Confirmação aplicada' : 'Seguir mesmo assim'}
          </Button>
        </Card>
      )}

      <Card>
        <Text variant="h3" className="font-semibold">Datas da acomodação</Text>
        <Text variant="caption" className="mt-1">
          Pré-preenchido com as datas do curso. Selecione em blocos semanais (domingo a domingo).
        </Text>
        <View className="mt-3 gap-2">
          <Text variant="caption">Início</Text>
          <TextInput
            value={accommodationStartDate}
            editable={false}
            className="h-11 rounded-lg border border-border bg-surfaceSecondary px-3"
          />
          <Text variant="caption">Inícios semanais</Text>
          <View className="flex-row flex-wrap gap-2">
            {weeklyAccommodationStartOptions.map((option) => {
              const selected = option === accommodationStartDate;
              return (
                <TouchableOpacity
                  key={`acc-start-${option}`}
                  onPress={() => {
                    const weeks = isWeeklyRangeValid(accommodationStartDate, accommodationEndDate)
                      ? diffDays(accommodationStartDate, accommodationEndDate) / 7
                      : 4;
                    setAccommodationStartDate(option);
                    setAccommodationEndDate(addDays(option, weeks * 7));
                  }}
                  className={`rounded-lg border px-3 py-2 ${
                    selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                  }`}
                >
                  <Text variant="caption">
                    {new Date(`${option}T00:00:00.000Z`).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text variant="caption">Fim</Text>
          <TextInput
            value={accommodationEndDate}
            editable={false}
            className="h-11 rounded-lg border border-border bg-surfaceSecondary px-3"
          />
          <Text variant="caption">Datas válidas (domingo a domingo)</Text>
          <View className="flex-row flex-wrap gap-2">
            {weeklyAccommodationOptions.map((option) => {
              const selected = option.endDate === accommodationEndDate;
              return (
                <TouchableOpacity
                  key={`acc-week-${option.weeks}`}
                  onPress={() => setAccommodationEndDate(option.endDate)}
                  className={`rounded-lg border px-3 py-2 ${
                    selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'
                  }`}
                >
                  <Text variant="caption">
                    {option.weeks} sem • até {new Date(`${option.endDate}T00:00:00.000Z`).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedAccommodationId && !isWeeklyRangeValid(accommodationStartDate, accommodationEndDate) && (
            <Text variant="caption" className="text-red-600">
              Período inválido: selecione um fim semanal de domingo a domingo.
            </Text>
          )}
          <Text variant="caption">
            {selectedAccommodationId && accommodationPricing
              ? `Preço final do período: ${formatMoney(accommodationPricing.calculatedAmount ?? 0, accommodationPricing.currency)}`
              : 'Sem acomodação selecionada'}
          </Text>
        </View>
      </Card>

      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={() => setStep(1)}>
          Voltar
        </Button>
        <Button
          className="flex-1"
          onPress={() => setStep(3)}
          disabled={
            quoteLoading ||
            !quotePreview ||
            (Boolean(selectedAccommodationId) &&
              (!accommodationPricing ||
                !isWeeklyRangeValid(accommodationStartDate, accommodationEndDate))) ||
            (Boolean(selectedAccommodationId) &&
              !isSelectedAccommodationRecommended &&
              !acceptedNonRecommendedAccommodation)
          }
        >
          Revisar pacote
        </Button>
      </View>
      <Button
        variant="ghost"
        onPress={() => {
          setSelectedAccommodationId('');
          setAcceptedNonRecommendedAccommodation(false);
        }}
      >
        Seguir sem acomodação
      </Button>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <Card>
        <Text variant="h3" className="font-semibold">Etapa 3 — Confirmação do pacote</Text>
        <Text variant="caption" className="mt-1">
          Revise os itens e valores antes de enviar sua intenção.
        </Text>
      </Card>

      <Card>
        <Text variant="h3" className="font-semibold">Resumo final</Text>
        {quoteLoading ? (
          <Text variant="caption" className="mt-2">Calculando...</Text>
        ) : quotePreview ? (
          <View className="mt-2 gap-1">
            <Text variant="caption">Curso: {formatMoney(quotePreview.courseAmount, quotePreview.currency)}</Text>
            <Text variant="caption">Acomodação: {formatMoney(quotePreview.accommodationAmount, quotePreview.currency)}</Text>
            <Text variant="caption">Total: {formatMoney(quotePreview.totalAmount, quotePreview.currency)}</Text>
            <Text variant="caption">
              Entrada (30%): {formatMoney(quotePreview.downPaymentAmount, quotePreview.currency)}
            </Text>
            <Text variant="caption">
              Saldo: {formatMoney(quotePreview.remainingAmount, quotePreview.currency)}
            </Text>
            {(quotePreview.items ?? []).map((item) => (
              <Text key={item.id} variant="caption">
                {item.itemType}: {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
              </Text>
            ))}
          </View>
        ) : (
          <Text variant="caption" className="mt-2">Não foi possível montar o pacote.</Text>
        )}
      </Card>

      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={() => setStep(2)}>
          Voltar
        </Button>
        <Button className="flex-1" onPress={submitIntent} disabled={saving || !quotePreview}>
          {saving ? 'Finalizando...' : 'Fechar pacote'}
        </Button>
      </View>
    </>
  );

  const renderResultStep = () => (
    <>
      <Card>
        <Text variant="h3" className="font-semibold">Etapa 4 — Resultado</Text>
        {resultType === 'auto_approve' ? (
          <>
            <Text variant="body" className="mt-2">
              Intenção auto-aprovada para este curso. Você pode seguir para checkout.
            </Text>
            <Button
              className="mt-3"
              onPress={() => {
                if (createdEnrollmentId) {
                  navigation.replace(StackRoutes.ENROLLMENT_CHECKOUT, {
                    enrollmentId: createdEnrollmentId,
                  });
                  return;
                }
                navigation.replace(StackRoutes.ACADEMIC_JOURNEY);
              }}
            >
              {createdEnrollmentId ? 'Ir para checkout' : 'Ver jornada acadêmica'}
            </Button>
          </>
        ) : (
          <>
            <Text variant="body" className="mt-2">
              Proposta enviada com sucesso. Nosso time vai validar e retornar aprovação.
            </Text>
            <Button className="mt-3" onPress={() => navigation.replace(StackRoutes.ACADEMIC_JOURNEY)}>
              Ver jornada acadêmica
            </Button>
          </>
        )}
      </Card>
    </>
  );

  if (loading) {
    return (
      <Screen safeArea={true} scrollable={true}>
        <View className="px-4 py-4">
          <Text variant="body">Carregando fluxo...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={true} scrollable={true}>
      <View className="px-4 py-4 gap-4">
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} className="flex-row items-center gap-2">
          <Ionicons name="arrow-back" size={22} color={colorValues.textPrimary} />
          <Text variant="body" className="font-medium">Voltar</Text>
        </TouchableOpacity>

        <Text variant="h2" className="font-semibold">Fechamento de pacote</Text>
        {renderStepHeader()}

        {openIntent && (
          <Card className="border-amber-200 bg-amber-50">
            <Text variant="h3" className="font-semibold text-amber-900">Você já possui uma intenção em aberto</Text>
            <Text variant="caption" className="mt-2 text-amber-700">
              Ajuste a intenção atual antes de iniciar outra.
            </Text>
            <Button className="mt-3" variant="outline" onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}>
              Ir para jornada acadêmica
            </Button>
          </Card>
        )}

        {hasActiveEnrollment && (
          <Card className="border-blue-200 bg-blue-50">
            <Text variant="caption" className="text-blue-900">
              Você possui matrícula ativa. Ainda assim pode montar novo pacote se não tiver intenção pendente.
            </Text>
          </Card>
        )}

        {!openIntent && (
          <>
            {step === 1 && renderCourseStep()}
            {step === 2 && renderAccommodationStep()}
            {step === 3 && renderConfirmStep()}
            {step === 4 && renderResultStep()}
          </>
        )}

        <Modal
          visible={Boolean(selectedAccommodationPreview)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedAccommodationPreview(null)}
        >
          <View className="flex-1 justify-center bg-black/40 px-3 py-8">
            <View className="h-[86%] rounded-2xl bg-white p-4">
              {selectedAccommodationPreview && (
                <>
                  <View className="flex-row items-start justify-between border-b border-slate-100 pb-3">
                    <View className="flex-1 pr-3">
                      <Text variant="h3" className="font-semibold">
                        {selectedAccommodationPreview.title}
                      </Text>
                      <Text variant="caption" className="mt-1">
                        {selectedAccommodationPreview.accommodationType} •{' '}
                        {selectedAccommodationPreview.location}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedAccommodationPreview(null)}
                      className="rounded-full border border-border p-2"
                    >
                      <Ionicons name="close" size={18} color={colorValues.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
                    {!!selectedAccommodationPreview.image && (
                      <Image
                        source={{ uri: selectedAccommodationPreview.image }}
                        resizeMode="cover"
                        className="mt-3 h-48 w-full rounded-xl"
                      />
                    )}

                    <View className="mt-3 gap-1">
                      <Text variant="caption">
                        Score: {Number(selectedAccommodationPreview.score ?? 0).toFixed(1)}
                      </Text>
                      {!!selectedAccommodationPreview.recommendationBadge && (
                        <Text variant="caption" className="text-primary-700">
                          {selectedAccommodationPreview.recommendationBadge}
                        </Text>
                      )}
                      <Text variant="caption">
                        Janela atual: {new Date(`${accommodationStartDate}T00:00:00.000Z`).toLocaleDateString()} -{' '}
                        {new Date(`${accommodationEndDate}T00:00:00.000Z`).toLocaleDateString()}
                      </Text>
                      <Text variant="body" className="font-medium">
                        {modalPricingLoading
                          ? 'Calculando preço...'
                          : modalAccommodationPricing
                            ? `Preço final: ${formatMoney(
                                modalAccommodationPricing.calculatedAmount ?? 0,
                                modalAccommodationPricing.currency,
                              )}`
                            : `Base: CAD ${(selectedAccommodationPreview.priceInCents / 100).toLocaleString()}/${selectedAccommodationPreview.priceUnit}`}
                      </Text>
                    </View>
                  </ScrollView>

                  <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={() => setSelectedAccommodationPreview(null)}
                    >
                      Fechar
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={() => {
                        selectAccommodation(selectedAccommodationPreview.id);
                        setSelectedAccommodationPreview(null);
                      }}
                    >
                      Selecionar
                    </Button>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <Text variant="body" className="text-red-700">{error}</Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
