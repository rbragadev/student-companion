import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import { AccommodationDetailScreen, CourseDetailScreen } from './src/screens';
import { RootStackParamList, StackRoutes } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={StackRoutes.MAIN_TABS} component={TabNavigator} />
          <Stack.Screen 
            name={StackRoutes.ACCOMMODATION_DETAIL} 
            component={AccommodationDetailScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen 
            name={StackRoutes.COURSE_DETAIL} 
            component={CourseDetailScreen}
            options={{ presentation: 'card' }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
