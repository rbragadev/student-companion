import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import './global.css';

export default function App() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-2xl font-bold text-gray-800">
        Student Companion App
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
