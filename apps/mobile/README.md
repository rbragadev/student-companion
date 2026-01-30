# 📱 Student Companion - Mobile App

Aplicativo React Native desenvolvido com Expo, TypeScript e NativeWind para ajudar estudantes a se organizarem.

## 🚀 Tecnologias

- **React Native** com **Expo** ~54.0
- **TypeScript** ~5.9
- **NativeWind** ^4.2 (Tailwind CSS para React Native)
- **React** 19.1.0
- **Workspaces** (npm)

## 🎨 Design System

### Cores Principais
Baseado no design das telas de referência:

```typescript
// Primárias
primary-500: '#00B4D8'    // Azul turquesa principal
primary-600: '#0096B6'    // Azul mais escuro  
primary-50: '#E6F7FF'     // Azul muito claro

// Neutras
background: '#FFFFFF'     // Fundo principal
surface: '#F8F9FA'        // Cards e superfícies
border: '#E9ECEF'         // Bordas

// Textos  
textPrimary: '#212529'    // Texto principal
textSecondary: '#6C757D'  // Texto secundário
textMuted: '#ADB5BD'      // Texto sutil

// Acentos
accent: '#FF6B35'         // Laranja para destaques
success: '#28A745'        // Verde
warning: '#FFC107'        // Amarelo
```

### Tipografia
Hierarquia consistente de texto:

- **h1**: `text-2xl font-bold` - Títulos principais
- **h2**: `text-xl font-semibold` - Subtítulos  
- **h3**: `text-lg font-medium` - Seções
- **body**: `text-base` - Texto padrão
- **bodySecondary**: `text-sm text-textSecondary` - Texto secundário
- **caption**: `text-xs text-textMuted` - Legendas

## 🏗 Estrutura de Pastas

```
apps/mobile/
├── src/
│   ├── components/
│   │   ├── ui/                 # Componentes básicos
│   │   │   ├── Button.tsx      # Botões com variantes
│   │   │   ├── Card.tsx        # Cards com sombras
│   │   │   └── Text.tsx        # Texto tipográfico
│   │   ├── layout/             # Componentes de layout
│   │   │   └── Container.tsx   # Container com padding/gap
│   │   ├── features/           # Componentes específicos (futuro)
│   │   └── index.ts           # Exportações centralizadas
│   ├── screens/                # Telas da aplicação (futuro)
│   ├── hooks/                  # Custom hooks (futuro)
│   └── utils/
│       └── design-tokens.ts    # Tokens de design
├── assets/                     # Imagens e recursos
├── App.tsx                     # Componente raiz
├── global.css                  # Estilos globais Tailwind
├── tailwind.config.js          # Configuração personalizada
├── metro.config.js             # Configuração Metro + NativeWind
├── babel.config.js             # Configuração Babel
└── package.json
```

## 🧩 Componentes Disponíveis

### Button
Botão com múltiplas variantes e tamanhos:

```tsx
import { Button } from '@/src/components';

<Button variant="primary" size="md">
  Clique aqui
</Button>

// Variantes: primary, secondary, outline, ghost
// Tamanhos: sm, md, lg
```

### Card
Container com sombra e bordas arredondadas:

```tsx
import { Card } from '@/src/components';

<Card variant="elevated" padding="md">
  <Text>Conteúdo do card</Text>
</Card>

// Variantes: default, elevated, outlined
// Padding: none, sm, md, lg
```

### Text
Componente de texto tipográfico:

```tsx
import { Text } from '@/src/components';

<Text variant="h1" color="primary">
  Título Principal
</Text>

// Variantes: h1, h2, h3, body, bodySecondary, caption
// Cores: primary, secondary, muted, inverse, accent, success, warning, danger
```

### Container
Layout com padding e spacing consistentes:

```tsx
import { Container } from '@/src/components';

<Container padding="lg" gap="md">
  {/* Conteúdo */}
</Container>

// Padding: none, sm, md, lg, xl
// Gap: none, xs, sm, md, lg, xl
```

## 🎯 Design Tokens

Sistema de tokens para manter consistência:

```tsx
import { designTokens } from '@/src/utils/design-tokens';

// Spacing: xs, sm, md, lg, xl
// Typography: h1, h2, h3, body, bodySecondary, caption
// Shadow: none, sm, md, lg
// Radius: none, sm, md, lg, xl, full
```

## 📱 Como Executar

### Pré-requisitos
- Node.js 18+
- Expo CLI
- Expo Go no celular

### Comandos

```bash
# Instalar dependências (da raiz do projeto)
npm install

# Iniciar servidor de desenvolvimento  
npm run dev:mobile

# Ou diretamente na pasta mobile
cd apps/mobile
npm start

# Comandos específicos
npm run android    # Android
npm run ios       # iOS Simulator  
npm run web       # Web
```

### Executar no Dispositivo

1. Instale o **Expo Go** no seu celular
2. Execute `npm run dev:mobile`
3. Escaneie o QR code que aparece no terminal
4. O app abrirá no Expo Go

## 🔧 Configurações

### NativeWind
- **Configurado** com preset personalizado
- **CSS global** importado no App.tsx
- **Metro config** configurado para processar CSS

### TypeScript
- **Strict mode** habilitado
- **Expo base config** extendido
- **Path mapping** configurado (@/src/*)

### Workspace
- **Dependências compartilhadas** na raiz
- **Scripts workspace** no package.json principal
- **Estrutura monorepo** organizada

## 🎨 Exemplo de Uso

```tsx
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Container, Card, Text, Button } from './src/components';

export default function App() {
  return (
    <View className="flex-1 bg-background">
      <Container padding="lg" gap="lg">
        <Text variant="h1">Meu App</Text>
        
        <Card>
          <Text variant="h3">Card de Exemplo</Text>
          <Text variant="bodySecondary">
            Descrição do card
          </Text>
        </Card>
        
        <Button variant="primary" onPress={() => {}}>
          Ação Principal
        </Button>
      </Container>
      
      <StatusBar style="auto" />
    </View>
  );
}
```

## 🚧 Próximos Passos

- [ ] Implementar navegação (React Navigation/Expo Router)
- [ ] Criar telas específicas do app
- [ ] Adicionar componentes Input e Form
- [ ] Implementar componentes features (StudentCard, etc.)
- [ ] Configurar estado global (Context/Zustand)
- [ ] Integração com API
- [ ] Implementar autenticação

---

🎯 **Design System 100% funcional com NativeWind + TypeScript**