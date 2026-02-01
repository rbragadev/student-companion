/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

import { Platform } from 'react-native';

/**
 * Para desenvolvimento:
 * - iOS Simulator: use seu IP local (ex: 192.168.1.10:3000)
 * - Android Emulator: use 10.0.2.2:3000
 * - Dispositivo físico: use seu IP local na rede
 * 
 * Para descobrir seu IP:
 * - Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
 * - Windows: ipconfig
 */

const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',      // Android Emulator
  ios: 'http://192.168.68.103:3000',    // iOS Simulator - IP da máquina host
  default: 'http://192.168.68.103:3000',
});

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? DEV_API_URL  // Development - local API
    : 'https://api.studentcompanion.com', // Production API
  TIMEOUT: 10000, // 10 seconds
} as const;
