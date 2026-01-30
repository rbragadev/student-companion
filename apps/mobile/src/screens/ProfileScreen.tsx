import React from 'react';
import { Screen, Text, Card } from '../components';

export default function ProfileScreen() {
  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <Text variant="h1">Perfil</Text>
      <Card>
        <Text variant="body">Gerencie seu perfil 👤</Text>
      </Card>
    </Screen>
  );
}