import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentApi } from '../services/api/enrollmentApi';
import { colorValues } from '../utils/design-tokens';
import type { Enrollment } from '../types/enrollment.types';
import { RootStackParamList, StackRoutes } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const enrollmentStatusLabel: Record<Enrollment['status'], string> = {
  draft: 'Draft',
  started: 'Started',
  awaiting_school_approval: 'Awaiting School Approval',
  approved: 'Approved',
  checkout_available: 'Checkout Available',
  payment_pending: 'Payment Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  confirmed: 'Confirmed',
  enrolled: 'Enrolled',
  expired: 'Expired',
  rejected: 'Rejected',
  cancelled: 'Cancelada',
};

const enrollmentNextStepLabel: Record<Enrollment['status'], string> = {
  draft: 'Continuar aplicação',
  started: 'Enviar aplicação',
  awaiting_school_approval: 'Aguardar aprovação',
  approved: 'Ir para checkout',
  checkout_available: 'Pagar entrada',
  payment_pending: 'Concluir pagamento',
  partially_paid: 'Pagar saldo',
  paid: 'Aguardar confirmação',
  confirmed: 'Aguardando ativação',
  enrolled: 'Fluxo concluído',
  expired: 'Reiniciar fluxo',
  rejected: 'Refazer aplicação',
  cancelled: 'Nova matrícula',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function AcademicJourneyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollment', 'journey', userId],
    queryFn: () => enrollmentApi.getStudentJourney(userId ?? ''),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      void queryClient.invalidateQueries({ queryKey: ['enrollment', 'journey', userId] });
      void queryClient.invalidateQueries({ queryKey: ['enrollment', 'active', userId] });
    }, [queryClient, userId]),
  );

  const activeEnrollment = data?.activeEnrollment ?? null;
  const enrollmentHistory = (data?.enrollmentHistory ?? []).filter(
    (enrollment) => enrollment.id !== activeEnrollment?.id,
  );

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
          <Text variant="h2" className="font-semibold">Jornada Acadêmica</Text>
          <Text variant="bodySecondary" className="mt-1">
            Selecione uma matrícula para abrir o contexto completo.
          </Text>
        </View>

        {isLoading && <Text variant="body">Carregando jornada...</Text>}

        {isError && (
          <Card className="border-red-200 bg-red-50">
            <Text variant="body" className="text-red-700">Não foi possível carregar seus dados acadêmicos.</Text>
            <Button onPress={() => refetch()} className="mt-3">Tentar novamente</Button>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">Matrícula em aberto</Text>
              {activeEnrollment ? (
                <View className="mt-3 gap-1">
                  <Text variant="body" className="font-medium">{activeEnrollment.course.program_name}</Text>
                  <Text variant="caption">
                    {activeEnrollment.institution.name} {'>'} {activeEnrollment.school.name} {'>'} {activeEnrollment.unit.name}
                  </Text>
                  <Text variant="caption">Turma: {activeEnrollment.classGroup.name} ({activeEnrollment.classGroup.code})</Text>
                  <Text variant="caption">
                    Acomodação: {activeEnrollment.accommodation ? activeEnrollment.accommodation.title : 'Sem acomodação'}
                  </Text>
                  <Text variant="caption">Status: {enrollmentStatusLabel[activeEnrollment.status]}</Text>
                  <Text variant="caption">Próximo passo: {enrollmentNextStepLabel[activeEnrollment.status]}</Text>
                  <Text variant="caption">Criada em: {formatDate(activeEnrollment.createdAt)}</Text>
                  <Button
                    className="mt-3"
                    onPress={() => navigation.navigate(StackRoutes.ENROLLMENT_DETAIL, { enrollmentId: activeEnrollment.id })}
                  >
                    Abrir matrícula
                  </Button>
                </View>
              ) : (
                <Text variant="caption" className="mt-2">Nenhuma matrícula em aberto no momento.</Text>
              )}
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Histórico de matrículas</Text>
              <View className="mt-3 gap-3">
                {enrollmentHistory.length === 0 && <Text variant="caption">Sem histórico de matrículas.</Text>}
                {enrollmentHistory.map((enrollment) => (
                  <View key={enrollment.id} className="rounded-lg border border-border px-3 py-2">
                    <Text variant="body" className="font-medium">{enrollment.course.program_name}</Text>
                    <Text variant="caption">Status: {enrollmentStatusLabel[enrollment.status]}</Text>
                    <Text variant="caption">Turma: {enrollment.classGroup.name} ({enrollment.classGroup.code})</Text>
                    <Text variant="caption">Período: {enrollment.academicPeriod.name}</Text>
                    <Text variant="caption">Acomodação: {enrollment.accommodation ? enrollment.accommodation.title : 'Sem acomodação'}</Text>
                    <Button
                      className="mt-2"
                      variant="outline"
                      onPress={() => navigation.navigate(StackRoutes.ENROLLMENT_DETAIL, { enrollmentId: enrollment.id })}
                    >
                      Abrir contexto da matrícula
                    </Button>
                  </View>
                ))}
              </View>
            </Card>

          </>
        )}
      </View>
    </Screen>
  );
}
