import React from 'react';
import { Screen, Text, Card } from '../components';

export default function CoursesScreen() {
  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <Text variant="h1">Cursos</Text>
      <Card>
        <Text variant="body">Explore seus cursos 💬</Text>
      </Card>
    </Screen>
  );
}