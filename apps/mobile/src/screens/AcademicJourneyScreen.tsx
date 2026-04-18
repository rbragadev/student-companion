import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentApi } from '../services/api/enrollmentApi';
import { colorValues } from '../utils/design-tokens';
import type { Enrollment, EnrollmentIntent } from '../types/enrollment.types';
import { RootStackParamList, StackRoutes } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const intentStatusLabel: Record<EnrollmentIntent['status'], string> = {
  pending: 'Pendente',
  converted: 'Convertida',
  cancelled: 'Cancelada',
  denied: 'Negada',
};

const enrollmentStatusLabel: Record<Enrollment['status'], string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  denied: 'Negada',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export default function AcademicJourneyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollment', 'journey', userId],
    queryFn: () => enrollmentApi.getStudentJourney(userId ?? ''),
    enabled: !!userId,
  });

  const activeIntent = data?.activeIntent ?? null;
  const activeEnrollment = data?.activeEnrollment ?? null;
  const intentHistory = data?.intentHistory ?? [];
  const enrollmentHistory = data?.enrollmentHistory ?? [];

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
            Acompanhe intenção em andamento, matrícula ativa e histórico completo.
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
              <Text variant="h3" className="font-semibold">Em andamento</Text>
              {activeIntent ? (
                <View className="mt-3 gap-1">
                  <Text variant="body" className="font-medium">{activeIntent.course?.program_name ?? 'Curso'}</Text>
                  <Text variant="caption">Turma: {activeIntent.classGroup?.name ?? '-'} ({activeIntent.classGroup?.code ?? '-'})</Text>
                  <Text variant="caption">Período: {activeIntent.academicPeriod?.name ?? '-'}</Text>
                  <Text variant="caption">Status: {intentStatusLabel[activeIntent.status]}</Text>
                  <Text variant="caption">Criada em: {formatDate(activeIntent.createdAt)}</Text>
                  <Button
                    className="mt-3"
                    onPress={() => navigation.navigate(StackRoutes.ENROLLMENT_INTENT, { courseId: activeIntent.courseId })}
                  >
                    Ver intenção em aberto
                  </Button>
                </View>
              ) : (
                <Text variant="caption" className="mt-2">Nenhuma intenção pendente.</Text>
              )}
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Matrícula ativa</Text>
              {activeEnrollment ? (
                <View className="mt-3 gap-1">
                  <Text variant="body" className="font-medium">{activeEnrollment.course.program_name}</Text>
                  <Text variant="caption">{activeEnrollment.institution.name} {'>'} {activeEnrollment.school.name} {'>'} {activeEnrollment.unit.name}</Text>
                  <Text variant="caption">Turma: {activeEnrollment.classGroup.name} ({activeEnrollment.classGroup.code})</Text>
                  <Text variant="caption">Período: {activeEnrollment.academicPeriod.name}</Text>
                  <Text variant="caption">Status: {enrollmentStatusLabel[activeEnrollment.status]}</Text>
                  <Text variant="caption">Ativada em: {formatDate(activeEnrollment.createdAt)}</Text>
                </View>
              ) : (
                <Text variant="caption" className="mt-2">Você não possui matrícula ativa no momento.</Text>
              )}
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Histórico de intenções</Text>
              <View className="mt-3 gap-3">
                {intentHistory.length === 0 && <Text variant="caption">Sem histórico de intenções.</Text>}
                {intentHistory.map((intent) => (
                  <View key={intent.id} className="rounded-lg border border-border px-3 py-2">
                    <Text variant="body" className="font-medium">{intent.course?.program_name ?? 'Curso'}</Text>
                    <Text variant="caption">Status: {intentStatusLabel[intent.status]}</Text>
                    {intent.status === 'denied' && intent.deniedReason && (
                      <Text variant="caption">Motivo da negativa: {intent.deniedReason}</Text>
                    )}
                    <Text variant="caption">Período: {intent.academicPeriod?.name ?? '-'}</Text>
                    <Text variant="caption">Criada em: {formatDate(intent.createdAt)}</Text>
                  </View>
                ))}
              </View>
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
                    <Text variant="caption">Criada em: {formatDate(enrollment.createdAt)}</Text>
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
