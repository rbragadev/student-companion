import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { Container } from '../components/layout/Container';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { CopilotRecommendationCard } from '../components/features/CopilotRecommendationCard';
import { askCopilot, type CopilotResponse } from '../services/mockData';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_QUESTIONS = [
  'Where can I live with CAD 1,200/month?',
  'Which school offers the best value for money?',
  'Is homestay or shared house better?',
];

export default function CopilotScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async (customQuestion?: string) => {
    const queryQuestion = customQuestion || question;
    if (!queryQuestion.trim()) return;

    setLoading(true);
    setResponse(null);
    
    try {
      const result = await askCopilot(queryQuestion);
      setResponse(result);
      setQuestion('');
    } catch (error) {
      console.error('Error asking copilot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationPress = (recommendation: any) => {
    if (recommendation.type === 'accommodation') {
      navigation.navigate(StackRoutes.ACCOMMODATION_DETAIL, { accommodationId: recommendation.id });
    } else if (recommendation.type === 'course') {
      navigation.navigate(StackRoutes.COURSE_DETAIL, { courseId: recommendation.id });
    }
  };

  const handleSelectOption = (recommendation: any) => {
    // Aqui poderia abrir um formulário de lead ou ir direto para o detalhe
    handleRecommendationPress(recommendation);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          {/* Header */}
          <View className="py-6">
            <Text variant="h1" className="mb-2">
              AI Copilot
            </Text>
            <Text variant="body" className="text-neutral-600">
              Ask me anything about your study abroad journey
            </Text>
          </View>

          {/* Input de pergunta */}
          <Card className="mb-4">
            <View className="flex-row items-center">
              <Text variant="body" className="mr-2 text-neutral-400">
                🔍
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Tire sua dúvida..."
                placeholderTextColor={colorValues.textMuted}
                className="flex-1 text-base text-neutral-900"
                onSubmitEditing={() => handleAskQuestion()}
                returnKeyType="search"
                editable={!loading}
              />
              {Boolean(question.trim() && !loading) && (
                <TouchableOpacity onPress={() => handleAskQuestion()} className="ml-2">
                  <Text variant="body" className="text-primary-600 font-semibold">
                    Enviar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Quick Questions */}
          {!response && !loading && (
            <View className="mb-6">
              <Text variant="body" className="text-neutral-600 mb-3">
                Quick questions:
              </Text>
              <View className="gap-3">
                {QUICK_QUESTIONS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleAskQuestion(q)}
                    className="border border-primary-300 bg-primary-50 rounded-xl p-4"
                    activeOpacity={0.7}
                  >
                    <Text variant="body" className="text-primary-700">
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colorValues.primary[600]} />
              <Text variant="body" className="text-neutral-600 mt-4">
                Thinking...
              </Text>
            </View>
          )}

          {/* Response */}
          {response && !loading && (
            <View className="gap-4 pb-6">
              {/* Summary */}
              <Card>
                <View className="flex-row items-start mb-2">
                  <Text variant="body" className="text-2xl mr-2">
                    💡
                  </Text>
                  <Text variant="h2" className="flex-1">
                    Summary
                  </Text>
                </View>
                <Text variant="body" className="text-neutral-700">
                  {response.summary}
                </Text>
                {response.confidence && (() => {
                  const confidenceConfig = {
                    high: { bg: 'bg-success-50', text: 'text-success-700', label: '✓ High confidence' },
                    medium: { bg: 'bg-warning-50', text: 'text-warning-700', label: '⚠ Medium confidence' },
                    low: { bg: 'bg-error-50', text: 'text-error-700', label: '⚠ Low confidence' },
                  };
                  const config = confidenceConfig[response.confidence];
                  
                  return (
                    <View className="mt-3 flex-row items-center">
                      <View className={`px-3 py-1 rounded-full ${config.bg}`}>
                        <Text variant="caption" className={config.text}>
                          {config.label}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </Card>

              {/* Tradeoffs */}
              {response.tradeoffs.pros.length > 0 && (
                <Card>
                  <View className="flex-row items-start mb-3">
                    <Text variant="body" className="text-2xl mr-2">
                      ⚖️
                    </Text>
                    <Text variant="h2" className="flex-1">
                      Trade-offs
                    </Text>
                  </View>
                  
                  {response.tradeoffs.pros.length > 0 && (
                    <View className="mb-4">
                      <Text variant="body" className="text-success-600 font-semibold mb-2">
                        ✓ Pros
                      </Text>
                      {response.tradeoffs.pros.map((pro) => (
                        <View key={pro} className="flex-row items-start mb-2">
                          <Text variant="body" className="text-success-600 mr-2">
                            •
                          </Text>
                          <Text variant="body" className="flex-1 text-neutral-700">
                            {pro}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {response.tradeoffs.cons.length > 0 && (
                    <View>
                      <Text variant="body" className="text-error-600 font-semibold mb-2">
                        ✗ Cons
                      </Text>
                      {response.tradeoffs.cons.map((con) => (
                        <View key={con} className="flex-row items-start mb-2">
                          <Text variant="body" className="text-error-600 mr-2">
                            •
                          </Text>
                          <Text variant="body" className="flex-1 text-neutral-700">
                            {con}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              )}

              {/* Missing Info (Low Confidence) */}
              {response.confidence === 'low' && response.missingInfo && response.missingInfo.length > 0 && (
                <Card className="bg-warning-50 border border-warning-200">
                  <View className="flex-row items-start mb-3">
                    <Text variant="body" className="text-2xl mr-2">
                      ❓
                    </Text>
                    <Text variant="h2" className="flex-1 text-warning-800">
                      I need more information
                    </Text>
                  </View>
                  <Text variant="body" className="text-warning-700 mb-3">
                    To give you better recommendations, please answer:
                  </Text>
                  {response.missingInfo.map((info, index) => (
                    <View key={info} className="flex-row items-start mb-2">
                      <Text variant="body" className="text-warning-600 mr-2">
                        {index + 1}.
                      </Text>
                      <Text variant="body" className="flex-1 text-warning-800">
                        {info}
                      </Text>
                    </View>
                  ))}
                </Card>
              )}

              {/* Recommendations */}
              {response.recommendations.length > 0 && (
                <View>
                  <View className="flex-row items-center mb-4">
                    <Text variant="body" className="text-2xl mr-2">
                      🎯
                    </Text>
                    <Text variant="h2">
                      Recommendations for you
                    </Text>
                  </View>
                  <View className="gap-4">
                    {response.recommendations.map((recommendation) => (
                      <CopilotRecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        onPress={() => handleRecommendationPress(recommendation)}
                        onSelectOption={() => handleSelectOption(recommendation)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Ask Another Question */}
              <TouchableOpacity
                onPress={() => setResponse(null)}
                className="bg-neutral-100 rounded-xl p-4 items-center mt-2"
                activeOpacity={0.7}
              >
                <Text variant="body" className="text-neutral-700 font-semibold">
                  Ask another question
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Container>
      </ScrollView>
    </Screen>
  );
}