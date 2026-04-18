import React from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text, Card, Button } from '../components';
import { useUserInterests } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { useUserProfile } from '../hooks/api/useUserProfile';
import { useReviewsByUser } from '../hooks/api/useReviews';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { enrollmentApi } from '../services/api/enrollmentApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId, logout } = useAuth();
  const { data: user, isLoading: userLoading } = useUserProfile(userId ?? '');
  const { interests, loading: interestsLoading } = useUserInterests();
  const { data: reviews, isLoading: reviewsLoading } = useReviewsByUser(userId ?? '');
  const { data: activeEnrollment } = useQuery({
    queryKey: ['enrollment', 'active', userId],
    queryFn: () => enrollmentApi.getActiveEnrollmentByStudent(userId ?? ''),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const studentStatusLabel: Record<string, string> = {
    lead: 'Lead',
    application_started: 'Application Started',
    pending_enrollment: 'Pending Enrollment',
    enrolled: 'Enrolled',
  };

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleInterestPress = (id: string) => {
    console.log('View interest:', id);
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
          <Text variant="body" className="text-textSecondary">
            Loading...
          </Text>
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

  // Fonte de verdade no Profile: status global do aluno.
  const effectiveStudentStatus = user.studentStatus || activeEnrollment?.status || 'lead';
  const effectiveStudentStatusLabel =
    studentStatusLabel[effectiveStudentStatus] ??
    (activeEnrollment ? `Enrollment: ${activeEnrollment.status}` : effectiveStudentStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning';
      case 'contacted': return 'text-primary-500';
      case 'closed': return 'text-textMuted';
      default: return 'text-textSecondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'contacted': return 'Contacted';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const getReviewableTypeName = (type: string) => {
    switch (type) {
      case 'COURSE': return 'Course';
      case 'ACCOMMODATION': return 'Accommodation';
      case 'PLACE': return 'Place';
      default: return type;
    }
  };

  return (
    <Screen safeArea={true} scrollable={true}>
      {/* Back Button */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={24} color={colorValues.textPrimary} />
          <Text variant="body" className="text-textPrimary font-medium">
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View className="px-4 pt-4 pb-6 gap-4">
        {/* Avatar + Name */}
        <View className="items-center gap-3">
          <View className="relative">
            <Image
              source={{ uri: user.avatar }}
              className="w-24 h-24 rounded-full"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full"
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color={colorValues.textInverse} />
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text variant="h1" className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="body" className="text-textMuted">
              {user.email}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        <Button variant="outline" onPress={handleEditProfile}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="create-outline" size={20} color={colorValues.primary[500]} />
            <Text variant="body" className="text-primary-500 font-semibold">
              Edit Profile
            </Text>
          </View>
        </Button>
      </View>

      {/* Profile Info */}
      <View className="px-4 pb-4 gap-4">
        <Text variant="h2" className="text-lg font-semibold">
          Profile Information
        </Text>

        <Card>
          <View className="gap-4">
            {/* Phone */}
            <View className="flex-row items-center gap-3">
              <Ionicons name="call-outline" size={20} color={colorValues.primary[500]} />
              <View className="flex-1">
                <Text variant="caption" className="text-textMuted">
                  Phone
                </Text>
                <Text variant="body" className="font-medium">
                  {user.phone}
                </Text>
              </View>
            </View>

            <View className="h-px bg-border" />

            {/* Destination */}
            <View className="flex-row items-center gap-3">
              <Ionicons name="location-outline" size={20} color={colorValues.primary[500]} />
              <View className="flex-1">
                <Text variant="caption" className="text-textMuted">
                  Destination
                </Text>
                <Text variant="body" className="font-medium">
                  {user.preferences.destinationCity}, {user.preferences.destinationCountry}
                </Text>
              </View>
            </View>

            <View className="h-px bg-border" />

            {/* Purpose */}
            <View className="flex-row items-center gap-3">
              <Ionicons name="school-outline" size={20} color={colorValues.primary[500]} />
              <View className="flex-1">
                <Text variant="caption" className="text-textMuted">
                  Purpose
                </Text>
                <Text variant="body" className="font-medium capitalize">
                  {user.preferences.purpose}
                </Text>
              </View>
            </View>

            <View className="h-px bg-border" />
            <View className="flex-row items-center gap-3">
              <Ionicons name="pulse-outline" size={20} color={colorValues.primary[500]} />
              <View className="flex-1">
                <Text variant="caption" className="text-textMuted">
                  Student Status
                </Text>
                <Text variant="body" className="font-medium">
                  {effectiveStudentStatusLabel}
                </Text>
              </View>
            </View>

            {user.preferences.englishLevel && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="language-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      English Level
                    </Text>
                    <Text variant="body" className="font-medium">
                      {user.preferences.englishLevel}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user.preferences.arrivalDate && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="calendar-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      Expected Arrival
                    </Text>
                    <Text variant="body" className="font-medium">
                      {user.preferences.arrivalDate}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user.preferences.budgetAccommodationMax && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="cash-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      Budget
                    </Text>
                    <Text variant="body" className="font-medium">
                      Accommodation: {user.preferences.budgetAccommodationMax}
                    </Text>
                    {user.preferences.budgetCourseMax && (
                      <Text variant="body" className="font-medium">
                        Course: {user.preferences.budgetCourseMax}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </Card>

        {activeEnrollment && (
          <Card className="border-green-200 bg-green-50">
            <View className="gap-2">
              <Text variant="h3" className="font-semibold text-green-800">
                Matrícula ativa
              </Text>
              <Text variant="body" className="text-green-800">
                {activeEnrollment.course.program_name}
              </Text>
              <Text variant="caption" className="text-green-700">
                {activeEnrollment.institution.name} {'>'} {activeEnrollment.school.name} {'>'} {activeEnrollment.unit.name}
              </Text>
              <Text variant="caption" className="text-green-700">
                Turma: {activeEnrollment.classGroup.name} ({activeEnrollment.classGroup.code}) • {activeEnrollment.academicPeriod.name}
              </Text>
            </View>
          </Card>
        )}

        <Button
          variant="outline"
          onPress={() => navigation.navigate(StackRoutes.ACADEMIC_JOURNEY)}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="book-outline" size={20} color={colorValues.primary[500]} />
            <Text variant="body" className="text-primary-500 font-semibold">
              Ver Jornada Acadêmica
            </Text>
          </View>
        </Button>
      </View>

      {/* My Interests/Leads */}
      {!interestsLoading && interests.length > 0 && (
        <View className="px-4 pb-4 gap-3">
          <Text variant="h2" className="text-lg font-semibold">
            My Interests
          </Text>

          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              activeOpacity={0.7}
              onPress={() => handleInterestPress(interest.id)}
            >
              <Card>
                <View className="flex-row items-center gap-3">
                  <View className={`p-3 rounded-full ${
                    interest.type === 'accommodation' ? 'bg-primary-50' : 'bg-success/10'
                  }`}>
                    <Ionicons
                      name={interest.type === 'accommodation' ? 'home' : 'school'}
                      size={24}
                      color={interest.type === 'accommodation' ? colorValues.primary[500] : colorValues.success}
                    />
                  </View>

                  <View className="flex-1">
                    <Text variant="body" className="font-semibold">
                      {interest.title}
                    </Text>
                    <Text variant="caption" className="text-textMuted">
                      {interest.subtitle}
                    </Text>
                  </View>

                  <Text variant="caption" className={`font-medium ${getStatusColor(interest.status)}`}>
                    {getStatusLabel(interest.status)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* My Reviews */}
      {!reviewsLoading && reviews && reviews.length > 0 && (
        <View className="px-4 pb-4 gap-3">
          <Text variant="h2" className="text-lg font-semibold">
            My Reviews
          </Text>

          {reviews.map((review) => (
            <Card key={review.id}>
              <View className="gap-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text variant="body" className="font-semibold">
                      {getReviewableTypeName(review.reviewableType)}
                    </Text>
                    <Text variant="caption" className="text-textMuted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={16} color={colorValues.warning} />
                    <Text variant="body" className="font-semibold">
                      {review.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text variant="body" className="text-textSecondary">
                  {review.comment}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Logout */}
      <View className="px-4 pb-8">
        <Button variant="outline" onPress={handleLogout}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={20} color={colorValues.danger} />
            <Text variant="body" className="text-danger font-semibold">
              Logout
            </Text>
          </View>
        </Button>
      </View>
    </Screen>
  );
}
