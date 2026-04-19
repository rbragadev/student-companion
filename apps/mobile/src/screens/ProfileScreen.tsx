import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, Text, Card, Button } from '../components';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { useUserProfile, userQueryKeys } from '../hooks/api/useUserProfile';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentApi } from '../services/api/enrollmentApi';
import { userApi } from '../services/api/userApi';
import type { UpdateUserPreferencesPayload } from '../types/user.types';
import { apiClient } from '../services/api/client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const studentStatusLabel: Record<string, string> = {
  lead: 'Lead',
  application_started: 'Application Started',
  pending_enrollment: 'Pending Enrollment',
  enrolled: 'Enrolled',
};

const enrollmentJourneyLabel: Record<string, string> = {
  draft: 'Rascunho',
  started: 'Iniciada',
  awaiting_school_approval: 'Aguardando aprovação da escola',
  approved: 'Aprovada',
  checkout_available: 'Checkout disponível',
  payment_pending: 'Pagamento pendente',
  partially_paid: 'Parcialmente paga',
  paid: 'Paga',
  confirmed: 'Confirmada',
  enrolled: 'Matriculado',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

const journeyNextStepByStatus: Record<string, string> = {
  draft: 'Continuar montagem do pacote.',
  started: 'Enviar aplicação para análise.',
  awaiting_school_approval: 'Aguardar aprovação operacional.',
  approved: 'Seguir para checkout.',
  checkout_available: 'Pagar entrada para avançar.',
  payment_pending: 'Concluir pagamento pendente.',
  partially_paid: 'Pagar saldo restante.',
  paid: 'Aguardar confirmação final.',
  confirmed: 'Matrícula confirmada. Aguardando ativação.',
  enrolled: 'Matrícula ativa. Siga com curso e suporte.',
  rejected: 'Revisar e reenviar nova aplicação.',
  cancelled: 'Iniciar nova matrícula quando desejar.',
  expired: 'Fluxo expirado. Recomeçar aplicação.',
};

function formatMoney(value?: number) {
  if (!value && value !== 0) return '-';
  return `CAD ${Number(value).toFixed(0)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useUserProfile(userId ?? '');

  const { data: journey } = useQuery({
    queryKey: ['enrollment', 'journey', userId],
    queryFn: () => enrollmentApi.getStudentJourney(userId ?? ''),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const activeEnrollment = journey?.activeEnrollment ?? null;

  const { data: checkout } = useQuery({
    queryKey: ['enrollment', 'checkout', activeEnrollment?.id],
    queryFn: () => enrollmentApi.getEnrollmentCheckout(activeEnrollment!.id),
    enabled: !!activeEnrollment?.id,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const { data: preferenceOptions } = useQuery({
    queryKey: ['preferences', 'options'],
    queryFn: () => userApi.getPreferenceOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'user', userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders?userId=${userId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const [isEditingPreferences, setIsEditingPreferences] = React.useState(false);
  const [prefForm, setPrefForm] = React.useState<UpdateUserPreferencesPayload>({});

  React.useEffect(() => {
    if (!user?.preferences) return;
    const p = user.preferences;
    setPrefForm({
      destinationCity: p.destinationCity,
      destinationCountry: p.destinationCountry,
      purpose: p.purpose,
      englishLevel: p.englishLevel,
      budgetAccommodationMin: p.budgetAccommodationMin,
      budgetAccommodationMax: p.budgetAccommodationMax,
      budgetCourseMin: p.budgetCourseMin,
      budgetCourseMax: p.budgetCourseMax,
      interestedInAccommodation: p.interestedInAccommodation ?? true,
      accommodationTypePreference: p.accommodationTypePreference,
      budgetPreference: p.budgetPreference,
      locationPreference: p.locationPreference,
      notes: p.notes,
      maxDistanceToSchool: p.maxDistanceToSchool,
    });
  }, [user?.preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload: UpdateUserPreferencesPayload) =>
      userApi.updatePreferences(userId ?? '', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(userId ?? '') });
      setIsEditingPreferences(false);
    },
  });

  const handleSavePreferences = () => {
    const payload: UpdateUserPreferencesPayload = {
      ...prefForm,
      preferredAccommodationTypes: prefForm.accommodationTypePreference
        ? [prefForm.accommodationTypePreference]
        : [],
    };
    updatePreferencesMutation.mutate(payload);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (userLoading) {
    return (
      <Screen safeArea={true}>
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-textSecondary">Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen safeArea={true} padding="lg">
        <Text variant="body">User not found</Text>
      </Screen>
    );
  }

  const profileStatus = activeEnrollment?.status || user.studentStatus || 'lead';
  const journeyStatus = activeEnrollment?.status ?? null;

  return (
    <Screen safeArea={true} scrollable={true}>
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={24} color={colorValues.textPrimary} />
          <Text variant="body" className="text-textPrimary font-medium">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pt-4 pb-6 gap-4">
        <View className="items-center gap-3">
          <Image source={{ uri: user.avatar ?? undefined }} className="w-24 h-24 rounded-full" />
          <View className="items-center">
            <Text variant="h1" className="text-2xl font-bold">{user.firstName} {user.lastName}</Text>
            <Text variant="body" className="text-textMuted">{user.email}</Text>
          </View>
        </View>
      </View>

      <View className="px-4 pb-4 gap-4">
        <Text variant="h2" className="text-lg font-semibold">Dados pessoais</Text>
        <Card>
          <View className="gap-3">
            <Text variant="caption" className="text-textMuted">Telefone</Text>
            <Text variant="body" className="font-medium">{user.phone ?? '-'}</Text>
            <View className="h-px bg-border" />
            <Text variant="caption" className="text-textMuted">Status do aluno</Text>
            <Text variant="body" className="font-medium">
              {journeyStatus
                ? enrollmentJourneyLabel[journeyStatus] ?? journeyStatus
                : studentStatusLabel[profileStatus] ?? profileStatus}
            </Text>
          </View>
        </Card>

        <Text variant="h2" className="text-lg font-semibold">Minha Jornada</Text>
        <Card>
          <View className="gap-2">
            <Text variant="body" className="font-semibold">Resumo da jornada atual</Text>
            <Text variant="caption">Status atual: {journeyStatus ? (enrollmentJourneyLabel[journeyStatus] ?? journeyStatus) : 'Sem matrícula ativa'}</Text>
            <Text variant="caption">
              Próximo passo: {journeyStatus ? (journeyNextStepByStatus[journeyStatus] ?? 'Siga o fluxo da matrícula atual.') : 'Iniciar nova aplicação.'}
            </Text>
            <Text variant="caption">Checkout: {checkout?.state ?? 'não disponível'}</Text>
            {activeEnrollment && (
              <>
                <View className="h-px bg-border my-1" />
                <Text variant="caption">Curso: {activeEnrollment.course.program_name}</Text>
                <Text variant="caption">Instituição: {activeEnrollment.institution.name}</Text>
                <Text variant="caption">Escola: {activeEnrollment.school.name}</Text>
                <Text variant="caption">Período: {activeEnrollment.academicPeriod.name}</Text>
              </>
            )}
            <Button
              className="mt-2"
              variant="outline"
              onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}
            >
              Abrir Minha Jornada
            </Button>
          </View>
        </Card>

        <Card>
          <View className="gap-2">
            <Text variant="body" className="font-semibold">Reservas / Orders</Text>
            <Text variant="caption">
              Total de vendas vinculadas ao seu perfil: {orders.length}
            </Text>
            {orders.slice(0, 3).map((order: any) => (
              <View key={order.id} className="rounded-lg border border-border bg-surfaceSecondary px-3 py-2">
                <Text variant="caption" className="font-medium">
                  {order.type === 'accommodation'
                    ? 'Acomodação'
                    : order.type === 'course'
                      ? 'Curso'
                      : 'Pacote'}
                  {' • '}
                  {Number(order.totalAmount ?? 0).toFixed(2)} {order.currency ?? 'CAD'}
                </Text>
                <Text variant="caption">Status: {order.status}</Text>
                <Text variant="caption">Pagamento: {order.paymentStatus}</Text>
              </View>
            ))}
            {orders.length === 0 ? (
              <Text variant="caption">Nenhuma venda/reserva encontrada.</Text>
            ) : null}
          </View>
        </Card>

        <Text variant="h2" className="text-lg font-semibold">Preferências</Text>
        <Card>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="body" className="font-semibold">Contexto de recomendação</Text>
              <Button variant="outline" onPress={() => setIsEditingPreferences((v) => !v)}>
                {isEditingPreferences ? 'Cancelar' : 'Editar'}
              </Button>
            </View>

            {!isEditingPreferences ? (
              <>
                <Text variant="caption">Destino: {user.preferences.destinationCity}, {user.preferences.destinationCountry}</Text>
                <Text variant="caption">Objetivo: {user.preferences.purpose}</Text>
                <Text variant="caption">Nível inglês: {user.preferences.englishLevel ?? '-'}</Text>
                <Text variant="caption">Interesse em acomodação: {user.preferences.interestedInAccommodation ? 'Sim' : 'Não'}</Text>
                <Text variant="caption">Tipo preferido: {user.preferences.accommodationTypePreference ?? '-'}</Text>
                <Text variant="caption">Budget profile: {user.preferences.budgetPreference ?? '-'}</Text>
                <Text variant="caption">Location preference: {user.preferences.locationPreference ?? '-'}</Text>
                <Text variant="caption">Budget acomodação: {formatMoney(user.preferences.budgetAccommodationMin)} - {formatMoney(user.preferences.budgetAccommodationMax)}</Text>
                <Text variant="caption">Budget curso: {formatMoney(user.preferences.budgetCourseMin)} - {formatMoney(user.preferences.budgetCourseMax)}</Text>
                <Text variant="caption">Chegada prevista: {formatDate(user.preferences.arrivalDate)}</Text>
                <Text variant="caption">Notas: {user.preferences.notes ?? '-'}</Text>
              </>
            ) : (
              <View className="gap-2">
                <Text variant="caption" className="text-textMuted">Destino (cidade)</Text>
                <TextInput
                  value={prefForm.destinationCity ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, destinationCity: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder="Cidade"
                />

                <Text variant="caption" className="text-textMuted">Destino (país)</Text>
                <TextInput
                  value={prefForm.destinationCountry ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, destinationCountry: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder="País"
                />

                <Text variant="caption" className="text-textMuted">Objetivo</Text>
                <TextInput
                  value={prefForm.purpose ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, purpose: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder="study / college"
                />

                <Text variant="caption" className="text-textMuted">Tipo de acomodação preferido</Text>
                <TextInput
                  value={prefForm.accommodationTypePreference ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, accommodationTypePreference: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder={preferenceOptions?.accommodationTypeOptions?.map((o) => o.label).join(', ') || 'Homestay'}
                />

                <Text variant="caption" className="text-textMuted">Budget profile</Text>
                <TextInput
                  value={prefForm.budgetPreference ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, budgetPreference: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder={preferenceOptions?.budgetOptions?.map((o) => o.label).join(', ') || 'Standard'}
                />

                <Text variant="caption" className="text-textMuted">Location preference</Text>
                <TextInput
                  value={prefForm.locationPreference ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, locationPreference: text }))}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder={preferenceOptions?.locationOptions?.slice(0, 3).map((o) => o.label).join(', ') || 'Downtown'}
                />

                <View className="flex-row items-center justify-between py-1">
                  <Text variant="caption" className="text-textMuted">Interessado em acomodação</Text>
                  <Switch
                    value={prefForm.interestedInAccommodation ?? true}
                    onValueChange={(value) =>
                      setPrefForm((prev) => ({ ...prev, interestedInAccommodation: value }))
                    }
                  />
                </View>

                <Text variant="caption" className="text-textMuted">Notas</Text>
                <TextInput
                  value={prefForm.notes ?? ''}
                  onChangeText={(text) => setPrefForm((prev) => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  placeholder="Observações para operação"
                />

                <Button
                  onPress={handleSavePreferences}
                  disabled={updatePreferencesMutation.isPending}
                  className="mt-2"
                >
                  {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar preferências'}
                </Button>
              </View>
            )}
          </View>
        </Card>
      </View>

      <View className="px-4 pb-8">
        <Button variant="outline" onPress={handleLogout}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={20} color={colorValues.danger} />
            <Text variant="body" className="text-danger font-semibold">Logout</Text>
          </View>
        </Button>
      </View>
    </Screen>
  );
}
