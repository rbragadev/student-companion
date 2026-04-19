import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import {
  AccommodationDetailScreen,
  AccommodationCheckoutScreen,
  CourseDetailScreen,
  EnrollmentIntentScreen,
  AcademicJourneyScreen,
  EnrollmentDetailScreen,
  EnrollmentCheckoutScreen,
  PackageCartScreen,
  NotificationsScreen,
  PlaceDetailScreen,
  ProfileScreen,
  SettingsScreen,
  LoginScreen,
} from './src/screens';
import { RootStackParamList, StackRoutes } from './src/types/navigation';
import { QueryProvider } from './src/providers/QueryProvider';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={StackRoutes.MAIN_TABS} component={TabNavigator} />
      <Stack.Screen
        name={StackRoutes.ACCOMMODATION_DETAIL}
        component={AccommodationDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.ACCOMMODATION_CHECKOUT}
        component={AccommodationCheckoutScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.COURSE_DETAIL}
        component={CourseDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.ENROLLMENT_INTENT}
        component={EnrollmentIntentScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.ACADEMIC_JOURNEY}
        component={AcademicJourneyScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.ENROLLMENT_DETAIL}
        component={EnrollmentDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.ENROLLMENT_CHECKOUT}
        component={EnrollmentCheckoutScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.PACKAGE_CART}
        component={PackageCartScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.PLACE_DETAIL}
        component={PlaceDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.PROFILE}
        component={ProfileScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name={StackRoutes.SETTINGS}
        component={SettingsScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <LoginScreen />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SafeAreaProvider style={{ flex: 1 }}>
          <AppNavigator />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
