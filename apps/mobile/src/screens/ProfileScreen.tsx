import React from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button } from '../components';
import { useUserProfile, useUserInterests, useUserReviews } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';

export default function ProfileScreen() {
  const { user, loading: userLoading } = useUserProfile();
  const { interests, loading: interestsLoading } = useUserInterests();
  const { reviews, loading: reviewsLoading } = useUserReviews();

  const handleEditProfile = () => {
    console.log('Edit profile');
    // TODO: Navegar para tela de edição
  };

  const handleInterestPress = (id: string) => {
    console.log('View interest:', id);
    // TODO: Navegar para detalhe do interesse
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => console.log('Logout confirmed')
        }
      ]
    );
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

  return (
    <Screen safeArea={true} scrollable={true}>
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
                  {user.destination.city}, {user.destination.country}
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
                  {user.purpose}
                </Text>
              </View>
            </View>

            {user.englishLevel && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="language-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      English Level
                    </Text>
                    <Text variant="body" className="font-medium">
                      {user.englishLevel}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user.arrivalDate && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="calendar-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      Expected Arrival
                    </Text>
                    <Text variant="body" className="font-medium">
                      {user.arrivalDate}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {user.budget && (
              <>
                <View className="h-px bg-border" />
                <View className="flex-row items-center gap-3">
                  <Ionicons name="cash-outline" size={20} color={colorValues.primary[500]} />
                  <View className="flex-1">
                    <Text variant="caption" className="text-textMuted">
                      Budget
                    </Text>
                    <Text variant="body" className="font-medium">
                      Accommodation: {user.budget.accommodation}
                    </Text>
                    {user.budget.course && (
                      <Text variant="body" className="font-medium">
                        Course: {user.budget.course}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </Card>
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
      {!reviewsLoading && reviews.length > 0 && (
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
                      {review.itemName}
                    </Text>
                    <Text variant="caption" className="text-textMuted">
                      {review.date}
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