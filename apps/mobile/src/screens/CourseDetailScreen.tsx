import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Card, Button } from '../components';
import { useCourseById } from '../hooks/api/useCourses';
import { useReviewsByReviewable } from '../hooks/api/useReviews';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentApi } from '../services/api/enrollmentApi';

const { width } = Dimensions.get('window');

type CourseDetailRouteProp = RouteProp<RootStackParamList, typeof StackRoutes.COURSE_DETAIL>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CourseDetailScreen() {
  const route = useRoute<CourseDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { courseId } = route.params;

  const { data: course, isLoading: courseLoading } = useCourseById(courseId);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByReviewable('COURSE', courseId);
  const { userId } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [hasOpenIntent, setHasOpenIntent] = React.useState(false);
  const [hasActiveEnrollment, setHasActiveEnrollment] = React.useState(false);

  const loading = courseLoading || reviewsLoading;
  const courseBadge = course?.badges.length ? course.badges[0] : undefined;
  const priceUnit = course?.priceUnit || 'month';

  React.useEffect(() => {
    const run = async () => {
      if (!userId) {
        setHasOpenIntent(false);
        setHasActiveEnrollment(false);
        return;
      }
      try {
        const journey = await enrollmentApi.getStudentJourney(userId);
        setHasOpenIntent(!!journey.activeIntent);
        setHasActiveEnrollment(!!journey.activeEnrollment);
      } catch {
        setHasOpenIntent(false);
        setHasActiveEnrollment(false);
      }
    };
    void run();
  }, [userId]);

  if (loading || !course) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="body" className="text-textSecondary">
          Loading...
        </Text>
      </View>
    );
  }

  const handleEnroll = () => {
    if (!userId) return;
    if (hasOpenIntent) {
      navigation.navigate(StackRoutes.ACADEMIC_JOURNEY);
      return;
    }
    navigation.navigate(StackRoutes.ENROLLMENT_INTENT, { courseId });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {course.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {course.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </View>

          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 flex-row justify-between px-4">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="bg-white/90 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color={colorValues.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => console.log('Share')}
              activeOpacity={0.7}
              className="bg-white/90 p-2 rounded-full"
            >
              <Ionicons name="share-outline" size={24} color={colorValues.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 pt-4 pb-24 gap-4">
          {/* School + Program */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="caption" className="text-textSecondary font-medium">
                {course.school?.name ?? '-'}
              </Text>
              {course.school?.isPartner && courseBadge && (
                <View className="bg-success/10 px-3 py-1 rounded-full">
                  <Text variant="caption" className="text-success font-medium">
                    {courseBadge}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="h1" className="text-2xl font-bold">
              {course.programName}
            </Text>
            <Text variant="body" className="text-textMuted">
              {course.school?.location ?? '-'}
            </Text>
          </View>

          {/* Price, Hours, Duration */}
          <Card>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={20} color={colorValues.primary[500]} />
                  <Text variant="body" className="text-textSecondary">
                    Weekly Hours
                  </Text>
                </View>
                <Text variant="body" className="font-semibold">
                  {course.weeklyHours}h/week
                </Text>
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={20} color={colorValues.primary[500]} />
                  <Text variant="body" className="text-textSecondary">
                    Duration
                  </Text>
                </View>
                <Text variant="body" className="font-semibold">
                  {course.duration}
                </Text>
              </View>

              {course.priceInCents && (
                <>
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="cash-outline" size={20} color={colorValues.primary[500]} />
                      <Text variant="body" className="text-textSecondary">
                        Price
                      </Text>
                    </View>
                    <Text variant="h2" className="text-xl font-bold text-primary-500">
                      ${(course.priceInCents / 100).toFixed(2)}
                      <Text variant="body" className="text-textMuted font-normal">
                        {' '}/{priceUnit}
                      </Text>
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Visa Type */}
          <Card>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="document-text-outline" size={20} color={colorValues.primary[500]} />
                <Text variant="h3" className="font-semibold">
                  Visa Type
                </Text>
              </View>
              <Text variant="body" className="text-textSecondary">
                {course.visaType}
              </Text>
            </View>
          </Card>

          {/* Description */}
          <View className="gap-2">
            <Text variant="h2" className="text-lg font-semibold">
              About this program
            </Text>
            <Text variant="body" className="text-textSecondary leading-relaxed">
              {course.description}
            </Text>
          </View>

          {/* Target Audience */}
          <Card className="bg-primary-50 border-primary-200">
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={20} color={colorValues.primary[500]} />
                <Text variant="h3" className="font-semibold text-primary-700">
                  Who is this for?
                </Text>
              </View>
              <Text variant="body" className="text-textSecondary leading-relaxed">
                {course.targetAudience}
              </Text>
            </View>
          </Card>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="h2" className="text-lg font-semibold">
                  Reviews
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={16} color={colorValues.warning} />
                  <Text variant="body" className="font-semibold">
                    {course.rating ? Number(course.rating).toFixed(1) : '0.0'}
                  </Text>
                  <Text variant="caption" className="text-textMuted">
                    ({course.ratingCount})
                  </Text>
                </View>
              </View>

              {reviews.map((review) => (
                <Card key={review.id}>
                  <View className="gap-3">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${review.userId}` }}
                        className="w-10 h-10 rounded-full"
                      />
                      <View className="flex-1">
                        <Text variant="body" className="font-semibold">
                          {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous'}
                        </Text>
                        <Text variant="caption" className="text-textMuted">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color={colorValues.warning} />
                        <Text variant="body" className="font-medium">
                          {review.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text variant="body" className="text-textSecondary leading-relaxed">
                      {review.comment}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4">
        {(hasOpenIntent || hasActiveEnrollment) && (
          <Text variant="caption" className="mb-2 text-amber-700">
            {hasActiveEnrollment
              ? 'Você já possui matrícula ativa. Ainda assim, pode iniciar nova intenção se não houver pendente.'
              : 'Você já possui uma intenção em aberto. Veja sua jornada antes de criar outra.'}
          </Text>
        )}
        <View className="flex-row items-center justify-between gap-4">
          <View>
            {course.priceInCents && (
              <>
                <Text variant="caption" className="text-textMuted">
                  Starting from
                </Text>
                <Text variant="h2" className="text-xl font-bold text-primary-500">
                  ${(course.priceInCents / 100).toFixed(2)}
                  <Text variant="body" className="text-textMuted font-normal text-sm">
                    {' '}/{priceUnit}
                  </Text>
                </Text>
              </>
            )}
          </View>
          <Button onPress={handleEnroll} className="flex-1" disabled={!userId}>
            {hasOpenIntent ? 'Ver intenção em aberto' : 'Iniciar matrícula'}
          </Button>
        </View>
      </View>
    </View>
  );
}
