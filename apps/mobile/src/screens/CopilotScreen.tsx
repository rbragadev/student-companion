import React from 'react';
import { Screen, Text, Card } from '../components';

export default function CopilotScreen() {
  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <Text variant="h1">Copilot IA</Text>
      <Card>
        <Text variant="body">Seu assistente inteligente 🤖</Text>
      </Card>
    </Screen>
  );
}