import React from 'react';
import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentApi } from '../services/api/enrollmentApi';
import type { Enrollment, EnrollmentTimelineEvent } from '../types/enrollment.types';
import { useUpsellAccommodationsByEnrollment } from '../hooks/api/useAccommodations';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof StackRoutes.ENROLLMENT_DETAIL>;

const enrollmentStatusLabel: Record<Enrollment['status'], string> = {
  application_started: 'Application Started',
  documents_pending: 'Documents Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  cancelled: 'Cancelada',
  active: 'Ativa',
  completed: 'Concluída',
  denied: 'Negada',
};

const DOCUMENT_STAGE_STATUSES: Enrollment['status'][] = ['documents_pending', 'under_review'];

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function isDocumentStage(status?: Enrollment['status']) {
  if (!status) return false;
  return DOCUMENT_STAGE_STATUSES.includes(status);
}

export default function EnrollmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { enrollmentId } = route.params;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [messageDraft, setMessageDraft] = React.useState('');
  const [accommodationMessageDraft, setAccommodationMessageDraft] = React.useState('');
  const [documentType, setDocumentType] = React.useState('');
  const [documentUrl, setDocumentUrl] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [selectedAccommodationId, setSelectedAccommodationId] = React.useState('');

  const enrollmentQuery = useQuery({
    queryKey: ['enrollment', 'detail', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentById(enrollmentId),
    enabled: !!enrollmentId,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const timelineQuery = useQuery({
    queryKey: ['enrollment', 'timeline', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentTimeline(enrollmentId),
    enabled: !!enrollmentId,
  });

  const documentsQuery = useQuery({
    queryKey: ['enrollment', 'documents', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentDocuments(enrollmentId),
    enabled: !!enrollmentId,
  });

  const messagesQuery = useQuery({
    queryKey: ['enrollment', 'messages', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentMessages(enrollmentId, 'enrollment'),
    enabled: !!enrollmentId,
  });

  const accommodationMessagesQuery = useQuery({
    queryKey: ['enrollment', 'messages', 'accommodation', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentMessages(enrollmentId, 'accommodation'),
    enabled: !!enrollmentId,
  });

  const unreadQuery = useQuery({
    queryKey: ['enrollment', 'unread-count', userId],
    queryFn: () => enrollmentApi.getUnreadMessagesCount(userId ?? ''),
    enabled: !!userId,
  });
  const packageSummaryQuery = useQuery({
    queryKey: ['enrollment', 'package-summary', enrollmentId],
    queryFn: () => enrollmentApi.getEnrollmentPackageSummary(enrollmentId),
    enabled: !!enrollmentId,
  });

  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['enrollment', 'detail', enrollmentId] });
        await queryClient.invalidateQueries({ queryKey: ['enrollment', 'timeline', enrollmentId] });
        await queryClient.invalidateQueries({ queryKey: ['enrollment', 'messages', enrollmentId] });
        await queryClient.invalidateQueries({
          queryKey: ['enrollment', 'messages', 'accommodation', enrollmentId],
        });
        await queryClient.invalidateQueries({ queryKey: ['enrollment', 'documents', enrollmentId] });
        await queryClient.invalidateQueries({ queryKey: ['enrollment', 'package-summary', enrollmentId] });
        await queryClient.invalidateQueries({ queryKey: ['accommodations', 'upsell-enrollment', enrollmentId] });
        if (userId) {
          await enrollmentApi.markEnrollmentMessagesAsRead({ enrollmentId, userId });
          await queryClient.invalidateQueries({ queryKey: ['enrollment', 'unread-count', userId] });
        }
      };
      void refresh();
    }, [enrollmentId, queryClient, userId]),
  );

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !messageDraft.trim()) return;
      await enrollmentApi.sendEnrollmentMessage({
        enrollmentId,
        senderId: userId,
        message: messageDraft.trim(),
        channel: 'enrollment',
      });
    },
    onSuccess: async () => {
      setMessageDraft('');
      setFeedback('Mensagem enviada.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'messages', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'timeline', enrollmentId] }),
        userId
          ? queryClient.invalidateQueries({ queryKey: ['enrollment', 'unread-count', userId] })
          : Promise.resolve(),
      ]);
    },
  });

  const sendAccommodationMessageMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !accommodationMessageDraft.trim()) return;
      await enrollmentApi.sendEnrollmentMessage({
        enrollmentId,
        senderId: userId,
        message: accommodationMessageDraft.trim(),
        channel: 'accommodation',
      });
    },
    onSuccess: async () => {
      setAccommodationMessageDraft('');
      setFeedback('Mensagem da acomodação enviada.');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['enrollment', 'messages', 'accommodation', enrollmentId],
        }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'timeline', enrollmentId] }),
        userId
          ? queryClient.invalidateQueries({ queryKey: ['enrollment', 'unread-count', userId] })
          : Promise.resolve(),
      ]);
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!documentType.trim() || !documentUrl.trim()) return;
      await enrollmentApi.uploadEnrollmentDocument({
        enrollmentId,
        type: documentType.trim(),
        fileUrl: documentUrl.trim(),
      });
    },
    onSuccess: async () => {
      setDocumentType('');
      setDocumentUrl('');
      setFeedback('Documento enviado.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'documents', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'timeline', enrollmentId] }),
      ]);
    },
  });
  const setAccommodationMutation = useMutation({
    mutationFn: async (accommodationId?: string | null) =>
      enrollmentApi.setEnrollmentAccommodation(enrollmentId, accommodationId),
    onSuccess: async () => {
      setFeedback('Acomodação do pacote atualizada.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'detail', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['enrollment', 'package-summary', enrollmentId] }),
        queryClient.invalidateQueries({ queryKey: ['accommodations', 'upsell-enrollment', enrollmentId] }),
      ]);
    },
  });

  const enrollment = enrollmentQuery.data;
  const timeline = timelineQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const accommodationMessages = accommodationMessagesQuery.data ?? [];
  const unreadCount = unreadQuery.data ?? 0;
  const chatEvents: EnrollmentTimelineEvent[] = timeline.filter((item) => item.type !== 'enrollment_created');
  const upsellAccommodationsQuery = useUpsellAccommodationsByEnrollment(enrollmentId);
  const upsellAccommodations = upsellAccommodationsQuery.data ?? [];
  const isAccommodationClosed = enrollment?.accommodationStatus === 'closed';

  React.useEffect(() => {
    setSelectedAccommodationId(enrollment?.accommodation?.id ?? '');
  }, [enrollment?.accommodation?.id]);

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
          <Text variant="h2" className="font-semibold">Contexto da Matrícula</Text>
          <Text variant="bodySecondary" className="mt-1">
            Dados acadêmicos, financeiro, documentos, chat e timeline.
          </Text>
        </View>

        {feedback && (
          <Card className="border-green-200 bg-green-50">
            <Text variant="caption" className="text-green-700">{feedback}</Text>
          </Card>
        )}

        {enrollmentQuery.isLoading && <Text variant="body">Carregando matrícula...</Text>}

        {enrollmentQuery.isError && (
          <Card className="border-red-200 bg-red-50">
            <Text variant="body" className="text-red-700">Não foi possível carregar a matrícula.</Text>
            <Button onPress={() => enrollmentQuery.refetch()} className="mt-3">Tentar novamente</Button>
          </Card>
        )}

        {!!enrollment && (
          <>
            <Card>
              <Text variant="h3" className="font-semibold">Resumo acadêmico</Text>
              <View className="mt-3 gap-1">
                <Text variant="caption">ID: {enrollment.id}</Text>
                <Text variant="body" className="font-medium">{enrollment.course.program_name}</Text>
                <Text variant="caption">Instituição: {enrollment.institution.name}</Text>
                <Text variant="caption">Escola: {enrollment.school.name}</Text>
                <Text variant="caption">Unidade: {enrollment.unit.name}</Text>
                <Text variant="caption">Turma: {enrollment.classGroup.name} ({enrollment.classGroup.code})</Text>
                <Text variant="caption">Período: {enrollment.academicPeriod.name}</Text>
                <Text variant="caption">Status atual: {enrollmentStatusLabel[enrollment.status]}</Text>
                <Text variant="caption">Atualizado em: {formatDate(enrollment.createdAt)}</Text>
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Financeiro</Text>
              {packageSummaryQuery.data?.pricing ? (
                <View className="mt-3 gap-1">
                  <Text variant="caption">
                    Matrícula: {packageSummaryQuery.data.pricing.enrollmentAmount.toFixed(2)} {packageSummaryQuery.data.pricing.currency}
                  </Text>
                  <Text variant="caption">
                    Acomodação: {packageSummaryQuery.data.pricing.accommodationAmount.toFixed(2)} {packageSummaryQuery.data.pricing.currency}
                  </Text>
                  <Text variant="caption">
                    Total do pacote: {packageSummaryQuery.data.pricing.packageTotalAmount.toFixed(2)} {packageSummaryQuery.data.pricing.currency}
                  </Text>
                  <Text variant="caption">
                    Comissão total: {packageSummaryQuery.data.pricing.totalCommissionAmount.toFixed(2)} ({packageSummaryQuery.data.pricing.commissionPercentage.toFixed(2)}%)
                  </Text>
                  {packageSummaryQuery.data.quote && (
                    <>
                      <Text variant="caption">
                        Tipo do pacote: {packageSummaryQuery.data.quote.type}
                      </Text>
                      <Text variant="caption">
                        Entrada ({packageSummaryQuery.data.quote.downPaymentPercentage.toFixed(2)}%): {packageSummaryQuery.data.quote.downPaymentAmount.toFixed(2)} {packageSummaryQuery.data.pricing.currency}
                      </Text>
                      <Text variant="caption">
                        Saldo restante: {packageSummaryQuery.data.quote.remainingAmount.toFixed(2)} {packageSummaryQuery.data.pricing.currency}
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <Text variant="caption" className="mt-2">Pricing ainda não definido para esta matrícula.</Text>
              )}
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Upsell de acomodações da escola</Text>
              <Text variant="caption" className="mt-1 text-textSecondary">
                Mostra somente acomodações recomendadas para {enrollment.school.name}.
              </Text>

              {upsellAccommodationsQuery.isLoading && (
                <Text variant="caption" className="mt-3">Carregando acomodações recomendadas...</Text>
              )}

              {upsellAccommodationsQuery.isError && (
                <Text variant="caption" className="mt-3 text-red-700">
                  Não foi possível carregar o upsell de acomodações.
                </Text>
              )}

              {!upsellAccommodationsQuery.isLoading && !upsellAccommodationsQuery.isError && (
                <View className="mt-3 gap-2">
                  {upsellAccommodations.length === 0 && (
                    <Text variant="caption" className="text-textSecondary">
                      Nenhuma acomodação recomendada para esta escola no momento.
                    </Text>
                  )}

                  {upsellAccommodations.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedAccommodationId(item.id)}
                      className={`rounded-lg border px-3 py-2 ${selectedAccommodationId === item.id ? 'border-primary-500 bg-primary-50' : 'border-border'}`}
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text variant="body" className="font-medium">{item.title}</Text>
                          <Text variant="caption">{item.accommodationType} • {item.location}</Text>
                          <Text variant="caption">
                            CAD {(item.priceInCents / 100).toLocaleString()}/{item.priceUnit}
                          </Text>
                        </View>
                        {!!item.recommendationBadge && (
                          <View className="rounded-full bg-primary-50 px-2 py-1">
                            <Text variant="caption" className="text-primary-700">
                              {item.recommendationBadge}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View className="mt-2 flex-row gap-2">
                    <Button
                      className="flex-1"
                      onPress={() => setAccommodationMutation.mutate(selectedAccommodationId || null)}
                      disabled={setAccommodationMutation.isPending || isAccommodationClosed}
                    >
                      {setAccommodationMutation.isPending ? 'Salvando...' : 'Salvar acomodação'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={() => setAccommodationMutation.mutate(null)}
                      disabled={setAccommodationMutation.isPending || isAccommodationClosed}
                    >
                      Sem acomodação
                    </Button>
                  </View>
                  <Text variant="caption" className="text-textSecondary">
                    Status da acomodação: {enrollment.accommodationStatus}
                    {enrollment.accommodationClosedAt ? ` • Fechada em ${formatDate(enrollment.accommodationClosedAt)}` : ''}
                  </Text>
                  {isAccommodationClosed && (
                    <Text variant="caption" className="text-amber-700">
                      Acomodação fechada pelo time. Não é possível trocar.
                    </Text>
                  )}

                  {!!selectedAccommodationId && (
                    <Button
                      variant="ghost"
                      onPress={() =>
                        navigation.navigate(StackRoutes.ACCOMMODATION_DETAIL, {
                          accommodationId: selectedAccommodationId,
                        })
                      }
                    >
                      Ver detalhes da acomodação selecionada
                    </Button>
                  )}
                </View>
              )}
            </Card>

            {isDocumentStage(enrollment.status) && (
              <Card>
                <Text variant="h3" className="font-semibold">Documentos</Text>
                <Text variant="caption" className="mt-1 text-textSecondary">
                  Etapa documental ativa. Envie os documentos solicitados.
                </Text>
                <View className="mt-3 gap-2">
                  <TextInput
                    value={documentType}
                    onChangeText={setDocumentType}
                    placeholder="Tipo do documento"
                    className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  />
                  <TextInput
                    value={documentUrl}
                    onChangeText={setDocumentUrl}
                    placeholder="URL do arquivo"
                    className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  />
                  <Button
                    onPress={() => uploadDocumentMutation.mutate()}
                    disabled={uploadDocumentMutation.isPending || !documentType.trim() || !documentUrl.trim()}
                  >
                    {uploadDocumentMutation.isPending ? 'Enviando...' : 'Enviar documento'}
                  </Button>

                  {documents.length === 0 && (
                    <Text variant="caption" className="text-textSecondary">Nenhum documento enviado até o momento.</Text>
                  )}
                  {documents.map((document) => (
                    <View key={document.id} className="rounded-lg border border-border px-3 py-2">
                      <Text variant="body" className="font-medium">{document.type}</Text>
                      <Text variant="caption">Status: {document.status}</Text>
                      <Text variant="caption">{document.fileUrl}</Text>
                      {document.adminNote && <Text variant="caption">Nota: {document.adminNote}</Text>}
                    </View>
                  ))}
                </View>
              </Card>
            )}

            <Card>
              <View className="flex-row items-center justify-between">
                <Text variant="h3" className="font-semibold">Chat da matrícula</Text>
                <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                  <Ionicons name="mail-unread-outline" size={14} color={colorValues.textSecondary} />
                  <Text variant="caption">Não lidas: {unreadCount}</Text>
                </View>
              </View>
              <View className="mt-3 gap-2">
                <TextInput
                  value={messageDraft}
                  onChangeText={setMessageDraft}
                  placeholder="Escreva sua mensagem para o time"
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  multiline={true}
                />
                <Button
                  onPress={() => sendMessageMutation.mutate()}
                  disabled={sendMessageMutation.isPending || !messageDraft.trim()}
                >
                  {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </View>

              <ScrollView className="mt-3 max-h-80" nestedScrollEnabled>
                <View className="gap-2">
                  {messages.map((message) => (
                    <View key={message.id} className="rounded-lg border border-border px-3 py-2">
                      <Text variant="caption" className="font-medium">
                        {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Usuário'}
                      </Text>
                      <Text variant="body">{message.message}</Text>
                      <Text variant="caption">{formatDate(message.createdAt)}</Text>
                    </View>
                  ))}

                  {chatEvents.map((event) => (
                    <View key={`event-${event.id}`} className="rounded-lg border border-dashed border-border px-3 py-2 bg-slate-50">
                      <Text variant="caption" className="font-medium">Evento da matrícula</Text>
                      <Text variant="caption">{event.title}</Text>
                      {event.description && <Text variant="caption">{event.description}</Text>}
                      <Text variant="caption">{formatDate(event.occurredAt)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Chat da acomodação</Text>
              <View className="mt-3 gap-2">
                <TextInput
                  value={accommodationMessageDraft}
                  onChangeText={setAccommodationMessageDraft}
                  placeholder="Escreva uma mensagem sobre acomodação"
                  className="rounded-lg border border-border px-3 py-2 text-textPrimary"
                  multiline={true}
                />
                <Button
                  onPress={() => sendAccommodationMessageMutation.mutate()}
                  disabled={sendAccommodationMessageMutation.isPending || !accommodationMessageDraft.trim()}
                >
                  {sendAccommodationMessageMutation.isPending ? 'Enviando...' : 'Enviar mensagem da acomodação'}
                </Button>
              </View>

              <ScrollView className="mt-3 max-h-80" nestedScrollEnabled>
                <View className="gap-2">
                  {accommodationMessages.length === 0 && (
                    <Text variant="caption" className="text-textSecondary">
                      Sem mensagens no canal de acomodação.
                    </Text>
                  )}
                  {accommodationMessages.map((message) => (
                    <View key={message.id} className="rounded-lg border border-border px-3 py-2">
                      <Text variant="caption" className="font-medium">
                        {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Usuário'}
                      </Text>
                      <Text variant="body">{message.message}</Text>
                      <Text variant="caption">{formatDate(message.createdAt)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Timeline da matrícula</Text>
              <View className="mt-3 gap-2">
                {timeline.length === 0 && <Text variant="caption">Sem eventos registrados.</Text>}
                {timeline.map((event) => (
                  <View key={event.id} className="rounded-lg border border-border px-3 py-2">
                    <Text variant="body" className="font-medium">{event.title}</Text>
                    {event.description && <Text variant="caption">{event.description}</Text>}
                    <Text variant="caption">{formatDate(event.occurredAt)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text variant="h3" className="font-semibold">Reviews (futuro)</Text>
              <Text variant="caption" className="mt-2 text-textSecondary">
                Esta seção será usada para avaliações do aluno dentro do contexto desta matrícula.
              </Text>
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}
