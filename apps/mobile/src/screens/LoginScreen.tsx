import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text } from '../components';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      Alert.alert('Erro ao entrar', 'E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-8">
        {/* Logo / Brand */}
        <View className="items-center gap-2">
          <Text variant="h1" className="text-3xl font-bold text-primary-500">
            Student Companion
          </Text>
          <Text variant="body" className="text-textMuted text-center">
            Sua jornada começa aqui
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View className="gap-1">
            <Text variant="caption" className="text-textSecondary font-medium">
              E-mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-textPrimary text-base"
            />
          </View>

          <View className="gap-1">
            <Text variant="caption" className="text-textSecondary font-medium">
              Senha
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-textPrimary text-base"
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            className="bg-primary-500 rounded-xl py-4 items-center mt-2"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text variant="body" className="text-white font-semibold text-base">
                Entrar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hint dev */}
        {__DEV__ && (
          <View className="items-center">
            <Text variant="caption" className="text-textMuted text-center">
              Dev: raphael@studentcompanion.dev / senha123
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
