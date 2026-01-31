import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  HomeScreen,
  CopilotScreen,
  AccommodationScreen,
  CourseScreen,
  ProfileScreen,
} from '../screens';
import { RootTabParamList, TabRoutes } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === TabRoutes.HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === TabRoutes.COPILOT) {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === TabRoutes.ACCOMMODATION) {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === TabRoutes.COURSES) {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === TabRoutes.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00B4D8',
        tabBarInactiveTintColor: '#ADB5BD',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name={TabRoutes.HOME} component={HomeScreen} />
      <Tab.Screen name={TabRoutes.COPILOT} component={CopilotScreen} />
      <Tab.Screen name={TabRoutes.ACCOMMODATION} component={AccommodationScreen} />
      <Tab.Screen name={TabRoutes.COURSES} component={CourseScreen} />
      <Tab.Screen name={TabRoutes.PROFILE} component={ProfileScreen} />
    </Tab.Navigator>
  );
}