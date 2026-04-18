import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { enrollmentIntentApi } from '../services/api/enrollmentIntentApi';
import type { AcademicPeriodOption, ClassGroupOption, EnrollmentIntent } from '../types/enrollment.types';
import { colorValues } from '../utils/design-tokens';
import { useAuth } from '../contexts/AuthContext';
import { userQueryKeys } from '../hooks/api/useUserProfile';
import { enrollmentApi } from '../services/api/enrollmentApi';
import type { Accommodation } from '../types/accommodation.types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.ENROLLMENT_INTENT>;

export default function EnrollmentIntentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { courseId } = route.params;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [classGroups, setClassGroups] = React.useState<ClassGroupOption[]>([]);
  const [periods, setPeriods] = React.useState<AcademicPeriodOption[]>([]);
  const [selectedClassGroupId, setSelectedClassGroupId] = React.useState('');
  const [selectedPeriodId, setSelectedPeriodId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [openIntent, setOpenIntent] = React.useState<EnrollmentIntent | null>(null);
  const [hasActiveEnrollment, setHasActiveEnrollment] = React.useState(false);
  const [recommendedAccommodations, setRecommendedAccommodations] = React.useState<Accommodation[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = React.useState<string>('');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    const run = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [groups, pendingIntent, activeEnrollment, accommodations] = await Promise.all([
          enrollmentIntentApi.getClassGroupsByCourse(courseId),
          enrollmentIntentApi.getOpenIntentByStudent(userId),
          enrollmentApi.getActiveEnrollmentByStudent(userId),
          enrollmentIntentApi.getRecommendedAccommodationsByCourse(courseId),
        ]);
        const active = groups.filter((group) => group.status === 'ACTIVE');
        setClassGroups(active);
        setOpenIntent(pendingIntent);
        setHasActiveEnrollment(!!activeEnrollment);
        setRecommendedAccommodations(accommodations);
        setSelectedAccommodationId(pendingIntent?.accommodation?.id ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar turmas');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [courseId, userId]);

  React.useEffect(() => {
    const run = async () => {
      if (!selectedClassGroupId) {
        setPeriods([]);
        setSelectedPeriodId('');
        return;
      }
      try {
        const values = await enrollmentIntentApi.getAcademicPeriodsByClassGroup(selectedClassGroupId);
        setPeriods(values.filter((item) => item.status === 'ACTIVE'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar períodos');
      }
    };
    void run();
  }, [selectedClassGroupId]);

  const submitIntent = async () => {
    if (!userId || !selectedClassGroupId || !selectedPeriodId || openIntent) return;
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      await enrollmentIntentApi.createEnrollmentIntent({
        studentId: userId,
        courseId,
        classGroupId: selectedClassGroupId,
        academicPeriodId: selectedPeriodId,
        accommodationId: selectedAccommodationId || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(userId) });
      setMessage(null);
      setToastMessage('Intenção enviada com sucesso');
      toastTimerRef.current = setTimeout(() => {
        navigation.replace(StackRoutes.ACADEMIC_JOURNEY);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar intenção');
    } finally {
      setSaving(false);
    }
  };

  const updateOpenIntentAccommodation = async (accommodationId?: string) => {
    if (!openIntent) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await enrollmentIntentApi.setIntentAccommodation(
        openIntent.id,
        accommodationId ?? null,
      );
      setOpenIntent(updated);
      setSelectedAccommodationId(updated.accommodation?.id ?? '');
      setToastMessage(
        accommodationId ? 'Acomodação atualizada na intenção' : 'Acomodação removida da intenção',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar acomodação da intenção');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen safeArea={true} scrollable={true}>
      {toastMessage && (
        <View className="absolute top-6 left-4 right-4 z-50">
          <Card className="border-green-200 bg-green-50">
            <Text variant="body" className="text-green-700">{toastMessage}</Text>
          </Card>
        </View>
      )}
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
          <Text variant="h2" className="font-semibold">Iniciar matrícula</Text>
          <Text variant="bodySecondary" className="mt-1">
            {openIntent
              ? 'Você já possui uma intenção pendente. Revise ou ajuste essa intenção antes de iniciar outra.'
              : 'Selecione turma e período para registrar sua intenção.'}
          </Text>
        </View>

        {openIntent && (
          <Card className="border-amber-200 bg-amber-50">
            <Text variant="h3" className="font-semibold text-amber-900">
              Você já possui uma intenção em aberto
            </Text>
            <Text variant="body" className="mt-2 text-amber-800">
              {openIntent.course?.program_name ?? 'Curso selecionado'}
            </Text>
            <Text variant="caption" className="text-amber-700">
              Turma: {openIntent.classGroup?.name ?? '-'} ({openIntent.classGroup?.code ?? '-'})
            </Text>
            <Text variant="caption" className="text-amber-700">
              Período: {openIntent.academicPeriod?.name ?? '-'}
            </Text>
            <Text variant="caption" className="mt-2 text-amber-700">
              Conclua ou ajuste essa intenção antes de iniciar uma nova.
            </Text>
          </Card>
        )}

        {hasActiveEnrollment && (
          <Card className="border-blue-200 bg-blue-50">
            <Text variant="h3" className="font-semibold text-blue-900">
              Você já possui matrícula ativa
            </Text>
            <Text variant="caption" className="mt-2 text-blue-800">
              Você pode iniciar nova intenção desde que não exista intenção pendente.
            </Text>
            <Button
              className="mt-3"
              onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}
            >
              Ver jornada acadêmica
            </Button>
          </Card>
        )}

        {loading ? (
          <Text variant="body">Carregando turmas...</Text>
        ) : openIntent ? (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">Acomodação do pacote (opcional)</Text>
              <Text variant="caption" className="mt-1">
                Sugestões recomendadas pela escola do seu curso.
              </Text>
              <View className="mt-3 gap-2">
                {recommendedAccommodations.map((accommodation) => {
                  const selected = selectedAccommodationId === accommodation.id;
                  return (
                    <TouchableOpacity
                      key={accommodation.id}
                      onPress={() => setSelectedAccommodationId(accommodation.id)}
                      activeOpacity={0.7}
                      className={`rounded-lg border px-3 py-2 ${selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'}`}
                    >
                      <Text variant="body" className="font-medium">
                        {accommodation.title}
                      </Text>
                      <Text variant="caption">
                        {accommodation.accommodationType} • CAD {(accommodation.priceInCents / 100).toLocaleString()}/{accommodation.priceUnit}
                      </Text>
                      {!!accommodation.recommendationBadge && (
                        <Text variant="caption" className="text-primary-700">
                          {accommodation.recommendationBadge}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {recommendedAccommodations.length === 0 && (
                  <Text variant="caption">Nenhuma acomodação recomendada para este contexto.</Text>
                )}
              </View>
              <View className="mt-3 flex-row gap-2">
                <Button
                  className="flex-1"
                  onPress={() => updateOpenIntentAccommodation(selectedAccommodationId || undefined)}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar acomodação'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => updateOpenIntentAccommodation(undefined)}
                  disabled={saving}
                >
                  Seguir sem acomodação
                </Button>
              </View>
            </Card>
            <Button
              variant="outline"
              onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}
            >
              Ir para jornada acadêmica
            </Button>
          </>
        ) : (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">1. Turma</Text>
              <View className="mt-3 gap-2">
                {classGroups.map((group) => {
                  const selected = selectedClassGroupId === group.id;
                  return (
                    <TouchableOpacity
                      key={group.id}
                      onPress={() => setSelectedClassGroupId(group.id)}
                      activeOpacity={0.7}
                      className={`rounded-lg border px-3 py-2 ${selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'}`}
                    >
                      <Text variant="body" className={selected ? 'text-primary-500' : 'text-textPrimary'}>
                        {group.name} ({group.code})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {classGroups.length === 0 && <Text variant="caption">Nenhuma turma ativa disponível.</Text>}
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">2. Período</Text>
              <View className="mt-3 gap-2">
                {periods.map((period) => {
                  const selected = selectedPeriodId === period.id;
                  return (
                    <TouchableOpacity
                      key={period.id}
                      onPress={() => setSelectedPeriodId(period.id)}
                      activeOpacity={0.7}
                      className={`rounded-lg border px-3 py-2 ${selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'}`}
                    >
                      <Text variant="body" className={selected ? 'text-primary-500' : 'text-textPrimary'}>
                        {period.name}
                      </Text>
                      <Text variant="caption">
                        {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selectedClassGroupId && periods.length === 0 && <Text variant="caption">Nenhum período ativo para essa turma.</Text>}
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">3. Acomodação (opcional)</Text>
              <Text variant="caption" className="mt-1">
                Recomendadas pela escola deste curso para upsell do pacote.
              </Text>
              <View className="mt-3 gap-2">
                {recommendedAccommodations.map((accommodation) => {
                  const selected = selectedAccommodationId === accommodation.id;
                  return (
                    <TouchableOpacity
                      key={accommodation.id}
                      onPress={() => setSelectedAccommodationId(accommodation.id)}
                      activeOpacity={0.7}
                      className={`rounded-lg border px-3 py-2 ${selected ? 'border-primary-500 bg-primary-50' : 'border-border bg-white'}`}
                    >
                      <Text variant="body" className={selected ? 'text-primary-600 font-medium' : 'font-medium'}>
                        {accommodation.title}
                      </Text>
                      <Text variant="caption">
                        {accommodation.accommodationType} • CAD {(accommodation.priceInCents / 100).toLocaleString()}/{accommodation.priceUnit}
                      </Text>
                      <Text variant="caption">
                        Score: {Number(accommodation.score ?? 0).toFixed(1)}
                      </Text>
                      {!!accommodation.recommendationBadge && (
                        <Text variant="caption" className="text-primary-700">
                          {accommodation.recommendationBadge}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {recommendedAccommodations.length === 0 && (
                  <Text variant="caption">Nenhuma acomodação recomendada para este contexto.</Text>
                )}
                <Button
                  variant="outline"
                  onPress={() => setSelectedAccommodationId('')}
                  disabled={!selectedAccommodationId}
                >
                  Seguir sem acomodação
                </Button>
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Resumo do pacote</Text>
              <View className="mt-2 gap-1">
                <Text variant="caption">Matrícula: ao confirmar intenção no SaaS</Text>
                {selectedAccommodationId ? (
                  (() => {
                    const selectedAccommodation = recommendedAccommodations.find(
                      (item) => item.id === selectedAccommodationId,
                    );
                    return (
                      <>
                        <Text variant="caption">
                          Acomodação: {selectedAccommodation?.title ?? '-'}
                        </Text>
                        <Text variant="caption">
                          Valor acomodação: CAD {((selectedAccommodation?.priceInCents ?? 0) / 100).toFixed(2)}
                        </Text>
                      </>
                    );
                  })()
                ) : (
                  <Text variant="caption">Acomodação: não selecionada</Text>
                )}
              </View>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <Text variant="body" className="text-red-700">{error}</Text>
              </Card>
            )}

            {message && (
              <Card className="border-green-200 bg-green-50">
                <Text variant="body" className="text-green-700">{message}</Text>
              </Card>
            )}

            <Button
              onPress={submitIntent}
              disabled={!selectedClassGroupId || !selectedPeriodId || saving}
            >
              {saving
                ? 'Processando...'
                : 'Confirmar intenção'}
            </Button>
            {hasActiveEnrollment && (
              <Button
                variant="outline"
                onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}
              >
                Ir para jornada acadêmica
              </Button>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
