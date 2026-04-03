import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { waiterLogin } from '../../services/api/authApi';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterPin'>;

export default function WaiterPinScreen({ route, navigation }: Props) {
  const { waiterName } = route.params;

  const {
    selectedWaiter,
    setSelectedWaiter,
    isLoading,
    setIsLoading,
  } = useAppContext();

  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Enter password');
      return;
    }

    try {
      setIsLoading(true);

      if (!selectedWaiter?.email) {
        Alert.alert('Waiter not selected');
        return;
      }

      const response = await waiterLogin({
        email: selectedWaiter.email,
        password: password.trim(),
      });

      setSelectedWaiter({
        id: String(response.user.id),
        waiterId: String(response.user.waiter_id),
        email: response.user.email,
        name: response.user.email,
      });

      navigation.navigate('TableDashboard');
    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error?.message || 'Invalid email or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Password</Text>
      <Text style={styles.subtitle}>{selectedWaiter?.email || waiterName}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable style={styles.button} onPress={handleLogin} disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});