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
import { waiters } from '../../data/mock/waiters';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterPin'>;

export default function WaiterPinScreen({ route, navigation }: Props) {
  const { waiterName } = route.params;
  const { setSelectedWaiter } = useAppContext();
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!password.trim()) {
      Alert.alert('Enter password');
      return;
    }

    const matchedWaiter = waiters.find((waiter) => waiter.name === waiterName);

    if (!matchedWaiter) {
      Alert.alert('Waiter not found');
      return;
    }

    if (matchedWaiter.password && matchedWaiter.password !== password) {
      Alert.alert('Invalid password');
      return;
    }

    setSelectedWaiter(matchedWaiter);
    navigation.navigate('TableDashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Password</Text>
      <Text style={styles.subtitle}>{waiterName}</Text>

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

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
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