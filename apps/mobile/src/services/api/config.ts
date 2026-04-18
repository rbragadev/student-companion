import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detecta automaticamente o IP da máquina de desenvolvimento via Expo hostUri.
 * Funciona para iOS simulator, Android emulator e dispositivo físico na mesma rede.
 * Elimina a necessidade de alterar o IP manualmente a cada mudança de rede.
 */
function getDevApiUrl(): string {
  // expo-constants expõe o IP do dev server (ex: "192.168.1.100:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  // Fallback para emuladores quando não há hostUri
  return Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
  }) as string;
}

export const API_CONFIG = {
  BASE_URL: __DEV__ ? getDevApiUrl() : 'https://api.studentcompanion.com',
  TIMEOUT: 10000,
} as const;
