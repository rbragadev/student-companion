import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';

import { Screen, Card, Text, Button } from './src/components';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Screen safeArea={true} padding="lg" gap="lg">
        <Text variant="h1">Student Companion App</Text>
        
        <Card>
          <Text variant="h3">Welcome!</Text>
          <Text variant="bodySecondary" className="mt-2">
            Seu design system está funcionando perfeitamente! 🎉
          </Text>
        </Card>
        
        <View className="gap-3">
          <Button variant="primary">
            Button Primário
          </Button>
          
          <Button variant="outline">
            Button Outline  
          </Button>
          
          <Button variant="secondary" size="sm">
            Button Pequeno
          </Button>
        </View>
        
        <StatusBar style="auto" />
      </Screen>
    </SafeAreaProvider>
  );
}
