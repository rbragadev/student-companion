import React from 'react';
import { Screen, Text, Card } from '../components';

export default function HomeScreen() {
  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <Text variant="h1">Home</Text>
      <Card>
        <Text variant="body">Bem-vindo ao Student Companion! 🏠</Text>
      </Card>
    </Screen>
  );
}