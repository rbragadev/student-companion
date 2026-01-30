import React from 'react';
import { Screen, Text, Card } from '../components';

export default function AccommodationScreen() {
  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <Text variant="h1">Acomodação</Text>
      <Card>
        <Text variant="body">Encontre seu lugar ideal 📍</Text>
      </Card>
    </Screen>
  );
}