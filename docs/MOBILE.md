# 📱 Student Companion - Mobile App

Aplicativo React Native desenvolvido com Expo, TypeScript e NativeWind para ajudar estudantes internacionais.

## 🚀 Tecnologias

- **React Native** com **Expo** ~54.0
- **TypeScript** ~5.9
- **NativeWind** ^4.2 (Tailwind CSS para React Native)
- **TanStack Query** (React Query) - Estado assíncrono e cache
- **Axios** - Cliente HTTP
- **React Navigation** - Navegação entre telas

## 🏗 Estrutura de Pastas

```
apps/mobile/
├── src/
│   ├── components/
│   │   ├── ui/                 # Componentes básicos (Button, Card, Text)
│   │   ├── layout/             # Layout (Container, Screen)
│   │   ├── features/           # Componentes de domínio
│   │   └── index.ts
│   ├── screens/                # Telas da aplicação
│   │   ├── HomeScreen.tsx
│   │   ├── CourseScreen.tsx
│   │   ├── AccommodationScreen.tsx
│   │   └── ...
│   ├── navigation/             # Configuração de navegação
│   │   └── TabNavigator.tsx
│   ├── services/
│   │   └── api/                # Configuração de API
│   ├── hooks/
│   │   └── api/                # React Query hooks
│   ├── types/                  # TypeScript types
│   └── utils/
│       └── design-tokens.ts
├── assets/
├── App.tsx
└── package.json
```

## 🎨 Design System

### Cores Principais

```typescript
primary-500: '#00B4D8'    // Azul turquesa principal
primary-600: '#0096B6'    // Azul escuro  
primary-50: '#E6F7FF'     // Azul claro

background: '#FFFFFF'
surface: '#F8F9FA'
border: '#E9ECEF'

textPrimary: '#212529'
textSecondary: '#6C757D'
textMuted: '#ADB5BD'

accent: '#FF6B35'
success: '#28A745'
```

### Componentes UI

#### Button
```tsx
<Button variant="primary" size="md">
  Clique aqui
</Button>
```

Variantes: `primary`, `secondary`, `outline`, `ghost`  
Tamanhos: `sm`, `md`, `lg`

#### Card
```tsx
<Card variant="elevated" padding="md">
  <Text>Conteúdo</Text>
</Card>
```

Variantes: `default`, `elevated`, `outlined`  
Padding: `none`, `sm`, `md`, `lg`

#### Text
```tsx
<Text variant="h1" color="primary">Título</Text>
```

Variantes: `h1`, `h2`, `h3`, `body`, `bodySecondary`, `caption`

### Layout

#### Container
```tsx
<Container padding="lg" gap="md">
  {children}
</Container>
```

#### Screen
```tsx
<Screen>
  {/* Conteúdo com SafeAreaView */}
</Screen>
```

## 🌐 Integração com API

### Hooks Disponíveis

```tsx
// Buscar perfil do usuário
const { data, isLoading } = useUserProfile(userId);

// Atualizar perfil
const { mutate } = useUpdateUserProfile(userId);
mutate({ firstName: 'Novo Nome' });
```

### Configuração

URLs configuradas em `src/services/api/config.ts`:

```typescript
// Development
iOS: http://localhost:3000
Android: http://10.0.2.2:3000

// Production
https://api.production.com
```

### Cache & Estado

- **React Query** gerencia cache automaticamente
- **staleTime**: 5 minutos
- **Refetch** automático ao reconectar
- **Retry**: 2 tentativas

## 📱 Navegação

### Bottom Tabs

```
Home | Cursos | Acomodações | Lugares | Perfil
```

### Telas Implementadas

- **HomeScreen** - Feed principal com recomendações
- **CourseScreen** - Lista de cursos
- **CourseDetailScreen** - Detalhes do curso
- **AccommodationScreen** - Lista de acomodações
- **AccommodationDetailScreen** - Detalhes da acomodação
- **PlacesScreen** - Lista de lugares
- **PlaceDetailScreen** - Detalhes do lugar
- **ProfileScreen** - Perfil do usuário
- **CopilotScreen** - Assistente IA (futuro)

## 🧩 Componentes de Features

### Cards

```tsx
<CourseCard course={course} />
<AccommodationListCard accommodation={accommodation} />
<PlaceCard place={place} />
<TopTripCard accommodation={topTrip} />
```

### Ações

```tsx
<SecondaryAction 
  icon={icon}
  title={title}
  onPress={onPress}
/>
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Expo CLI
- Expo Go no celular (ou emulador)

### Comandos

```bash
# Da raiz do projeto
npm install
npm run dev:mobile

# Ou diretamente
cd apps/mobile
npx expo start
```

### Executar no Dispositivo

1. Instale **Expo Go** no celular
2. Execute `npm run dev:mobile`
3. Escaneie o QR code
4. App abrirá no Expo Go

## 🔧 Configurações Importantes

### NativeWind
- Preset personalizado configurado
- CSS global em `global.css`
- Metro config processando CSS

### TypeScript
- Strict mode habilitado
- Path mapping: `@/src/*`
- Types compartilhados em `src/types/`

## 📝 Próximos Passos

- [ ] Implementar tela de login/autenticação
- [ ] Adicionar formulários (favoritos, reviews)
- [ ] Implementar busca e filtros
- [ ] Notificações push
- [ ] Modo offline
- [ ] Testes E2E com Detox
- [ ] CI/CD com EAS Build

## 📚 Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
