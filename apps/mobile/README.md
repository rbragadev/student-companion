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


# API Integration Guide

Este guia explica como usar a integração de API com Axios + TanStack Query no app mobile.

## 📦 Stack

- **Axios**: Cliente HTTP para fazer requisições
- **TanStack Query (React Query)**: Gerenciamento de estado assíncrono, cache e sincronização

## 📁 Estrutura de Arquivos

```
src/
├── services/
│   └── api/
│       ├── config.ts        # Configurações da API (URLs, timeout)
│       ├── client.ts        # Axios instance com interceptors
│       └── userApi.ts       # Endpoints de usuário
├── hooks/
│   └── api/
│       └── useUserProfile.ts # React Query hooks
└── providers/
    └── QueryProvider.tsx    # TanStack Query provider
```

## 🚀 Como Usar

### 1. Buscar Perfil do Usuário

```tsx
import { useUserProfile } from '../hooks/api/useUserProfile';

export const ProfileScreen = () => {
  const { data: user, isLoading, error, refetch } = useUserProfile('test-user-1');

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Button title="Tentar novamente" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View>
      <Text>{user?.firstName} {user?.lastName}</Text>
      <Text>{user?.email}</Text>
    </View>
  );
};
```

### 2. Estados Disponíveis

O hook `useUserProfile` retorna vários estados úteis:

```tsx
const {
  data,           // Dados do usuário
  isLoading,      // true durante o primeiro carregamento
  isFetching,     // true durante qualquer fetch (incluindo background)
  isError,        // true se houve erro
  error,          // Objeto de erro
  isSuccess,      // true quando tem dados
  refetch,        // Função para refazer a busca manualmente
} = useUserProfile(userId);
```

### 3. Configuração de Cache

O React Query já vem configurado com cache inteligente:

- **staleTime**: 5 minutos - dados são considerados "frescos"
- **gcTime**: 10 minutos - tempo que dados ficam em cache
- **retry**: 2 tentativas em caso de erro
- **refetchOnReconnect**: true - refaz busca ao reconectar

```tsx
// Exemplo: customizar cache para uma query específica
const { data } = useUserProfile('user-123', {
  staleTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: true,
});
```

### 4. Invalidar Cache (depois de mutations)

Quando você atualizar dados (POST/PATCH), deve invalidar o cache:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { userQueryKeys } from '../hooks/api/useUserProfile';

const queryClient = useQueryClient();

// Após atualizar perfil
await updateProfile(userId, newData);

// Invalida o cache do usuário
queryClient.invalidateQueries({
  queryKey: userQueryKeys.profile(userId)
});
```

## 🔐 Autenticação

Os interceptors estão preparados para adicionar tokens automaticamente:

### No client.ts, descomente:

```typescript
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken(); // Sua função de obter token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

### Tratamento de erro 401:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
      navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);
```

## 📝 Criar Novos Endpoints

### 1. Adicionar no service (userApi.ts):

```typescript
export const userApi = {
  // ... endpoints existentes
  
  updateProfile: async (userId: string, payload: Partial<UserProfile>) => {
    const { data } = await apiClient.patch(`/users/${userId}`, payload);
    return data;
  },
};
```

### 2. Criar hook com mutation:

```typescript
// hooks/api/useUpdateUserProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api/userApi';
import { userQueryKeys } from './useUserProfile';

export const useUpdateUserProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<UserProfile>) => 
      userApi.updateProfile(userId, payload),
    
    onSuccess: () => {
      // Invalida o cache após sucesso
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.profile(userId)
      });
    },
  });
};
```

### 3. Usar na tela:

```tsx
const { mutate, isPending, isError } = useUpdateUserProfile('user-123');

const handleSave = () => {
  mutate(
    { firstName: 'New Name' },
    {
      onSuccess: () => {
        Alert.alert('Sucesso', 'Perfil atualizado!');
      },
      onError: (error) => {
        Alert.alert('Erro', error.message);
      },
    }
  );
};
```

## 🔧 Configurações

### Ambiente (Development vs Production)

A URL da API é configurada automaticamente em `config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000'           // Development
    : 'https://api.production.com',     // Production
};
```

### iOS: Localhost

Para testar no iOS Simulator com API local:
- Use `http://localhost:3000` ✅

### Android: Localhost

Para testar no Android Emulator com API local:
- Use `http://10.0.2.2:3000` (Android Emulator)
- Use `http://<SEU_IP>:3000` (Dispositivo físico)

Atualize em `config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'android' 
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000'
    : 'https://api.production.com',
};
```

## 🐛 Debug

### Ver requisições no console:

Os logs já estão configurados em modo desenvolvimento:

```
[API] GET /users/123
[API] Response: /users/123 200
```

### React Query DevTools (opcional):

Para adicionar o devtools do React Query:

```bash
npm install @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryProvider>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryProvider>
```

## ✅ Boas Práticas

1. **Sempre use hooks do React Query** - não faça fetch direto nos componentes
2. **Centralize query keys** - facilita invalidação
3. **Use optimistic updates** para melhor UX
4. **Trate erros globalmente** nos interceptors
5. **Configure staleTime** apropriadamente para cada endpoint
6. **Invalide cache** após mutations

## 📚 Recursos

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com/docs/intro)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
