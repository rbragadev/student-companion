import React, { useMemo, useState } from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen, Text } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

function SettingRow({ icon, title, subtitle, value, onPress, right }: Readonly<SettingRowProps>) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-3"
    >
      <View className="flex-row items-start gap-3 flex-1 pr-3">
        <View className="pt-1">
          <Ionicons name={icon} size={20} color={colorValues.primary[500]} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-medium text-textPrimary">{title}</Text>
          {subtitle ? <Text variant="caption" className="mt-0.5">{subtitle}</Text> : null}
        </View>
      </View>

      {right ?? (
        <View className="flex-row items-center gap-2">
          {value ? <Text variant="caption" className="text-textSecondary">{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colorValues.textMuted} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const appVersion = useMemo(() => '1.0.0', []);

  return (
    <Screen safeArea={true} scrollable={true}>
      <View className="px-4 py-4 gap-4 pb-8">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={22} color={colorValues.textPrimary} />
          <Text variant="body" className="font-medium">Voltar</Text>
        </TouchableOpacity>

        <View>
          <Text variant="h2" className="font-semibold">Configurações</Text>
          <Text variant="caption" className="mt-1">
            Ajustes da conta e preferências do app.
          </Text>
        </View>

        <Card>
          <Text variant="h3" className="font-semibold mb-1">Conta</Text>
          <SettingRow
            icon="person-outline"
            title="Perfil"
            subtitle="Editar dados pessoais"
            onPress={() => navigation.navigate(StackRoutes.PROFILE)}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            title="Segurança"
            subtitle="Senha e autenticação"
            value="Em breve"
          />
          <SettingRow
            icon="card-outline"
            title="Métodos de pagamento"
            subtitle="Cartões e faturamento"
            value="Em breve"
          />
        </Card>

        <Card>
          <Text variant="h3" className="font-semibold mb-1">Preferências do app</Text>
          <SettingRow
            icon="notifications-outline"
            title="Notificações push"
            subtitle="Receber avisos no aparelho"
            right={(
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={setPushNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: colorValues.primary[300] }}
                thumbColor={pushNotificationsEnabled ? colorValues.primary[500] : '#F9FAFB'}
              />
            )}
          />
          <SettingRow
            icon="mail-outline"
            title="Notificações por e-mail"
            subtitle="Atualizações da jornada"
            right={(
              <Switch
                value={emailNotificationsEnabled}
                onValueChange={setEmailNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: colorValues.primary[300] }}
                thumbColor={emailNotificationsEnabled ? colorValues.primary[500] : '#F9FAFB'}
              />
            )}
          />
          <SettingRow
            icon="moon-outline"
            title="Modo escuro"
            subtitle="Tema visual do aplicativo"
            right={(
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#D1D5DB', true: colorValues.primary[300] }}
                thumbColor={darkModeEnabled ? colorValues.primary[500] : '#F9FAFB'}
              />
            )}
          />
          <SettingRow
            icon="language-outline"
            title="Idioma"
            subtitle="Idioma do aplicativo"
            value="Português"
          />
        </Card>

        <Card>
          <Text variant="h3" className="font-semibold mb-1">Suporte e legal</Text>
          <SettingRow
            icon="help-circle-outline"
            title="Central de ajuda"
            subtitle="FAQ e suporte"
            value="Em breve"
          />
          <SettingRow
            icon="document-text-outline"
            title="Privacidade"
            subtitle="Política e uso de dados"
            value="Em breve"
          />
          <SettingRow
            icon="information-circle-outline"
            title="Versão do app"
            subtitle="Build instalada"
            value={appVersion}
          />
        </Card>

        <Button variant="outline" onPress={logout}>
          Sair da conta
        </Button>
      </View>
    </Screen>
  );
}
