# Student Companion Mobile

React Native 0.81 + Expo SDK 54.

## Stack

- **React Native 0.81** + **Expo SDK 54**
- **TypeScript**
- **NativeWind** ^4.2 (Tailwind CSS para RN)
- **TanStack Query** v5 — cache e estado assíncrono
- **Axios** — cliente HTTP
- **React Navigation** — navegação
- **AsyncStorage** — persistência local

## Executar

```bash
make mobile     # inicia Expo (npx expo start)
```

Requer Expo Go no celular ou emulador iOS/Android.

---

## Estrutura

```
apps/mobile/
├── App.tsx                   # Entrada: AuthProvider + AppNavigator
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx   # Estado de auth + login/logout
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── AccommodationScreen.tsx
│   │   ├── AccommodationDetailScreen.tsx
│   │   ├── CourseScreen.tsx
│   │   ├── CourseDetailScreen.tsx
│   │   ├── PlacesScreen.tsx
│   │   ├── PlaceDetailScreen.tsx
│   │   └── CopilotScreen.tsx
│   ├── navigation/
│   │   └── TabNavigator.tsx
│   ├── services/
│   │   └── api/
│   │       ├── config.ts     # URL dinâmica via expo-constants
│   │       ├── client.ts     # instância Axios + interceptors
│   │       ├── tokenStore.ts # módulo sem circular dep para Bearer token
│   │       └── *.ts          # services por recurso
│   ├── hooks/
│   │   └── api/              # React Query hooks
│   ├── components/
│   │   ├── ui/               # Button, Card, Text
│   │   ├── layout/           # Container, Screen
│   │   └── features/         # Cards de domínio
│   └── types/
```

---

## Autenticação

`AuthContext` gerencia o ciclo completo de autenticação:

- **Login** → chama `POST /auth/login`, persiste token + userId no `AsyncStorage` e no `tokenStore`
- **Logout** → limpa `AsyncStorage` + `tokenStore` + estado
- **Auto-logout** → interceptor Axios chama `tokenStore.callUnauthorized()` em respostas 401

`tokenStore.ts` é um módulo in-memory que quebra a dependência circular entre `client.ts` e `AuthContext`.

### IP Dinâmico

`config.ts` lê `Constants.expoConfig?.hostUri` para detectar o IP da máquina de dev automaticamente — sem necessidade de alterar IP manualmente.

```typescript
const host = Constants.expoConfig?.hostUri?.split(':')[0];
// → 'http://<ip-local>:3000'
```

---

## Telas

| Tela | Descrição |
|------|-----------|
| `LoginScreen` | Formulário e-mail/senha. Exibe credenciais dev em modo `__DEV__`. |
| `HomeScreen` | Hero card + recomendações personalizadas (scroll horizontal) + atalhos. |
| `ProfileScreen` | Avatar, dados do usuário, preferências, interesses (mock), reviews, logout. |
| `AccommodationScreen` | Top Trips (scroll) + listagem completa com busca e filtros. |
| `AccommodationDetailScreen` | Galeria, detalhes, rating breakdown, regras, comodidades, host. |
| `CourseScreen` | Lista com busca e filtro por escola. |
| `CourseDetailScreen` | Galeria, detalhes, reviews. |
| `PlacesScreen` | Filtro por categoria, lista com deal/student favorite. |
| `PlaceDetailScreen` | Galeria, horários, comodidades, reviews. |
| `CopilotScreen` | Q&A estruturado com summary, prós/contras, confiança. (dados mock) |

---

## Hooks de Dados

Todos usam TanStack Query com `staleTime: 5min`, `gcTime: 10min`, `retry: 2`.

| Hook | Endpoint |
|------|----------|
| `useUserProfile(userId)` | `GET /users/:id` |
| `useSchools()` | `GET /school` |
| `useCourses()` | `GET /course` |
| `useAccommodations()` | `GET /accommodation` |
| `usePlaces()` | `GET /place` |
| `useReviews(type, id)` | `GET /review?reviewableType=X&reviewableId=Y` |
| `useRecommendations(userId, type)` | `GET /recommendation/:userId?type=X` |

---

## Design System

### Cores principais

```typescript
primary-500: '#00B4D8'   // turquesa
primary-600: '#0096B6'
accent:      '#FF6B35'
success:     '#28A745'
background:  '#FFFFFF'
surface:     '#F8F9FA'
```

### Componentes UI

- `Button` — variants: `primary`, `secondary`, `outline`, `ghost`; sizes: `sm`, `md`, `lg`
- `Card` — variants: `default`, `elevated`, `outlined`
- `Text` — variants: `h1`, `h2`, `h3`, `body`, `bodySecondary`, `caption`
- `Container`, `Screen` — layout wrappers com SafeAreaView
